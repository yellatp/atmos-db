import { AtmosDB } from './db';
import { logger } from '../utils/logger';

export class AtmosMigrations {
  constructor(private db: AtmosDB) {}

  /**
   * Extremely simple basic migration script setting up standard tables
   */
  async up(tableNames: string[]): Promise<void> {
    for (const table of tableNames) {
      logger.info(`Validating / creating table: ${table}`);
      await this.db.raw(`
        CREATE TABLE IF NOT EXISTS ${table} (
          id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);
    }
  }
}
