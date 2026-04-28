import { D1Database, VectorizeIndex, R2Bucket, ExecutionContext } from '@cloudflare/workers-types';

export interface AtmosConfig {
  bindings: {
    db: D1Database;
    vectorize: VectorizeIndex;
    bucket?: R2Bucket;
    ai?: any; // Ai binding
  };
  ctx?: ExecutionContext; // Pass standard Cloudflare context to enable background processing
  options?: {
    autoEmbed?: boolean;
    embedModel?: string;
    namespace?: string;
    embedFields?: string[]; // Limit which string fields get embedded to save AI tokens
  };
}

export interface AtmosRecord {
  id: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface VectorMatch {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface AtmosSearchResult extends VectorMatch {
  record?: AtmosRecord;
}

export type AtmosErrorType = 
  | 'DB_ERROR' 
  | 'VECTOR_ERROR' 
  | 'STORAGE_ERROR' 
  | 'AUTH_ERROR' 
  | 'EMBED_ERROR' 
  | 'NOT_FOUND';
