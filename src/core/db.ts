import type { D1Database, D1Result } from '@cloudflare/workers-types';
import type { AtmosRecord } from '../types/index';
import { AtmosError } from '../utils/errors';

export class AtmosDB {
  constructor(private db: D1Database) {}

  async insert(table: string, data: Record<string, unknown>): Promise<AtmosRecord> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      
      const record: AtmosRecord = {
        id,
        data,
        createdAt: now,
        updatedAt: now
      };

      await this.db.prepare(
        `INSERT INTO ${table} (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)`
      ).bind(id, JSON.stringify(data), now, now).run();

      return record;
    } catch (err) {
      throw new AtmosError('DB_ERROR', `Failed to insert into ${table}`, err);
    }
  }

  async findById(table: string, id: string): Promise<AtmosRecord | null> {
    try {
      const result = await this.db.prepare(
        `SELECT * FROM ${table} WHERE id = ?`
      ).bind(id).first();

      if (!result) return null;
      
      return {
        id: result.id as string,
        data: JSON.parse(result.data as string),
        createdAt: result.created_at as string,
        updatedAt: result.updated_at as string
      };
    } catch (err) {
      throw new AtmosError('DB_ERROR', `Failed to find by id in ${table}`, err);
    }
  }

  async findAll(table: string, filters?: Record<string, unknown>): Promise<AtmosRecord[]> {
    try {
      let query = `SELECT * FROM ${table}`;
      const params: any[] = [];

      // A simple JSON search capability can be expanded here
      // For now, simple return all.

      const { results } = await this.db.prepare(query).all();
      
      return results.map(row => ({
        id: row.id as string,
        data: JSON.parse(row.data as string),
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string
      }));
    } catch (err) {
      throw new AtmosError('DB_ERROR', `Failed to list from ${table}`, err);
    }
  }

  async update(table: string, id: string, data: Record<string, unknown>): Promise<AtmosRecord> {
    try {
      const existing = await this.findById(table, id);
      if (!existing) throw new AtmosError('NOT_FOUND', `Record ${id} not found in ${table}`);

      const mergedData = { ...existing.data, ...data };
      const now = new Date().toISOString();

      await this.db.prepare(
        `UPDATE ${table} SET data = ?, updated_at = ? WHERE id = ?`
      ).bind(JSON.stringify(mergedData), now, id).run();

      return {
        ...existing,
        data: mergedData,
        updatedAt: now
      };
    } catch (err) {
      if (err instanceof AtmosError) throw err;
      throw new AtmosError('DB_ERROR', `Failed to update record in ${table}`, err);
    }
  }

  async delete(table: string, id: string): Promise<boolean> {
    try {
      const result = await this.db.prepare(
        `DELETE FROM ${table} WHERE id = ?`
      ).bind(id).run();
      
      return result.meta.changes > 0;
    } catch (err) {
      throw new AtmosError('DB_ERROR', `Failed to delete from ${table}`, err);
    }
  }

  async raw(query: string, params: unknown[] = []): Promise<D1Result> {
    try {
      const stmt = this.db.prepare(query);
      if (params.length > 0) {
        return await stmt.bind(...params).all();
      }
      return await stmt.all();
    } catch (err) {
      throw new AtmosError('DB_ERROR', `Raw query failed: ${query}`, err);
    }
  }
}
