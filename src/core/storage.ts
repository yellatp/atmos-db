import type { R2Bucket, R2Object, R2Objects } from '@cloudflare/workers-types';
import { AtmosError } from '../utils/errors';

export class AtmosStorage {
  constructor(private bucket: R2Bucket) {}

  async upload(key: string, data: ReadableStream | ArrayBuffer | string, options?: any): Promise<R2Object> {
    try {
      const result = await this.bucket.put(key, data, options);
      if (!result) throw new Error('Upload returned null');
      return result;
    } catch (err) {
      throw new AtmosError('STORAGE_ERROR', `Failed to upload ${key}`, err);
    }
  }

  async download(key: string): Promise<ReadableStream | null> {
    try {
      const object = await this.bucket.get(key);
      if (!object) return null;
      return object.body;
    } catch (err) {
      throw new AtmosError('STORAGE_ERROR', `Failed to download ${key}`, err);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await this.bucket.delete(key);
    } catch (err) {
      throw new AtmosError('STORAGE_ERROR', `Failed to delete ${key}`, err);
    }
  }

  async list(prefix?: string): Promise<R2Objects> {
    try {
      return await this.bucket.list(prefix ? { prefix } : undefined);
    } catch (err) {
      throw new AtmosError('STORAGE_ERROR', 'Failed to list objects', err);
    }
  }
}
