import type { VectorizeIndex } from '@cloudflare/workers-types';
import type { VectorMatch } from '../types/index';
import { AtmosError } from '../utils/errors';

export class AtmosVector {
  constructor(private index: VectorizeIndex) {}

  async upsert(id: string, values: number[], metadata?: Record<string, unknown>): Promise<void> {
    try {
      await this.index.upsert([{ id, values, metadata: metadata as Record<string, any> }]);
    } catch (err) {
      throw new AtmosError('VECTOR_ERROR', `Failed to upsert vector ${id}`, err);
    }
  }

  async query(vector: number[], options?: { topK?: number; returnMetadata?: 'none' | 'indexed' | 'all' }): Promise<VectorMatch[]> {
    try {
      const matches = await this.index.query(vector, {
        topK: options?.topK ?? 10,
        returnValues: false,
        returnMetadata: options?.returnMetadata ?? 'all'
      });
      
      return matches.matches.map(m => ({
        id: m.id,
        score: m.score,
        metadata: m.metadata as Record<string, unknown> | undefined
      }));
    } catch (err) {
      throw new AtmosError('VECTOR_ERROR', 'Failed to query vector index', err);
    }
  }

  async deleteById(id: string): Promise<void> {
    try {
      await this.index.deleteByIds([id]);
    } catch (err) {
      throw new AtmosError('VECTOR_ERROR', `Failed to delete vector ${id}`, err);
    }
  }

  async getById(id: string): Promise<VectorMatch | null> {
    try {
      const matches = await this.index.getByIds([id]);
      if (!matches || matches.length === 0) return null;
      
      const m = matches[0];
      return {
        id: m.id,
        score: 1.0, // getByIds doesn't give a score relative to a query
        metadata: m.metadata as Record<string, unknown> | undefined
      };
    } catch (err) {
      throw new AtmosError('VECTOR_ERROR', `Failed to get vector ${id}`, err);
    }
  }
}
