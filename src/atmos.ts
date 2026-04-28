import type { AtmosConfig, AtmosRecord, AtmosSearchResult } from './types/index';
import { AtmosDB } from './core/db';
import { AtmosVector } from './core/vector';
import { AtmosStorage } from './core/storage';
import { AtmosAuth } from './core/auth';
import { AtmosEmbedder } from './ai/embedder';
import { AtmosError } from './utils/errors';
import { logger } from './utils/logger';

export class Atmos {
  public db: AtmosDB;
  public vector: AtmosVector;
  public store: AtmosStorage;
  public auth: AtmosAuth;
  public embedder?: AtmosEmbedder;
  private autoEmbed: boolean;
  public baseRaw: AtmosDB;
  private config: AtmosConfig;

  constructor(config: AtmosConfig) {
    this.config = config;
    this.db = new AtmosDB(config.bindings.db);
    this.baseRaw = this.db;
    this.vector = new AtmosVector(config.bindings.vectorize);
    
    if (config.bindings.bucket) {
      this.store = new AtmosStorage(config.bindings.bucket);
    } else {
      // Stub
      this.store = null as any;
    }
    
    this.auth = new AtmosAuth();

    this.autoEmbed = config.options?.autoEmbed ?? false;
    
    if (this.autoEmbed || config.bindings.ai) {
      if (!config.bindings.ai) {
         logger.warn('AI binding not found but autoEmbed is true or user trying to use AI');
      } else {
         this.embedder = new AtmosEmbedder(config.bindings.ai, config.options?.embedModel);
      }
    }
  }


  get raw() {
    return this.db;
  }

  /**
   * Predictive Pre-warming
   * Call this early in your user's request lifecycle (e.g. middleware) to wake up the AI model
   * in the background, preventing cold-starts during the actual search.
   */
  public warmUp(): void {
    if (this.embedder && this.config.ctx?.waitUntil) {
      const ping = async () => {
        try {
          // Send a tiny payload to spin up the Workers AI model container
          await this.embedder!.embed('warmup');
          logger.debug('AI model predictive pre-warming initiated.');
        } catch (e) {
          // Silent fail for warmup
        }
      };
      this.config.ctx.waitUntil(ping());
    }
  }

  async set(table: string, data: Record<string, unknown>): Promise<AtmosRecord> {
    const record = await this.db.insert(table, data);
    
    if (this.autoEmbed && this.embedder) {
      const processEmbedding = async () => {
        try {
          // Cost Management: Only embed specific fields if configured, else embed all strings
          const fieldsToEmbed = this.config.options?.embedFields 
            ? Object.entries(data).filter(([key]) => this.config.options!.embedFields!.includes(key)).map(([_, val]) => val)
            : Object.values(data);
            
          const stringValues = fieldsToEmbed
            .filter((val): val is string => typeof val === 'string')
            .join(' ');
            
          if (stringValues.trim().length > 0) {
            logger.debug(`Auto-embedding created for record ${record.id}`);
            const vectorValues = await this.embedder!.embed(stringValues);
            
            // Multi-tenancy isolation via metadata
            const metadata: Record<string, unknown> = { _table: table };
            if (this.config.options?.namespace) {
              metadata._namespace = this.config.options.namespace;
            }
            
            await this.vector.upsert(record.id, vectorValues, metadata);
          }
        } catch (error) {
          // Error handling for out-of-sync data (Eventual Consistency)
          logger.error(`Failed to process auto-embedding for record ${record.id}:`, error);
        }
      };

      // Performance: Process in background using waitUntil to avoid latency/cold-start blocking
      if (this.config.ctx?.waitUntil) {
        this.config.ctx.waitUntil(processEmbedding());
      } else {
        await processEmbedding();
      }
    }

    return record;
  }

  async get(table: string, id: string): Promise<AtmosRecord | null> {
    return this.db.findById(table, id);
  }

  async search(table: string, query: string, limit: number = 10): Promise<AtmosSearchResult[]> {
    if (!this.embedder) {
      throw new AtmosError('EMBED_ERROR', 'AI binding not configured for search');
    }

    const queryVector = await this.embedder.embed(query);
    const matches = await this.vector.query(queryVector, { topK: limit, returnMetadata: 'all' });
    
    // Filter by table and namespace (Security / Multi-tenancy)
    const namespace = this.config.options?.namespace;
    
    const validMatches = matches.filter(m => {
      const isTableMatch = !m.metadata?._table || m.metadata._table === table;
      const isNamespaceMatch = !namespace || m.metadata?._namespace === namespace;
      return isTableMatch && isNamespaceMatch;
    });

    // Join with D1 DB
    const results: AtmosSearchResult[] = await Promise.all(validMatches.map(async (match) => {
      const record = await this.db.findById(table, match.id);
      return {
        ...match,
        record: record || undefined
      };
    }));

    return results;
  }

  async remove(table: string, id: string): Promise<boolean> {
    const deletedDb = await this.db.delete(table, id);
    if (!deletedDb) return false;

    // Fire and forget Vectorize deletion
    this.vector.deleteById(id).catch(err => {
      logger.error(`Failed to delete vector for ${id} during remove`, err);
    });

    return true;
  }
}
