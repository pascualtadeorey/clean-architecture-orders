import { Pool } from 'pg';
import { PgUnitOfWork } from '../persistence/postgres/pg-unit-of-work.js';
import { getDatabaseUrl } from '../../composition/config.js';

export class DatabaseFactory {
  private static pool: Pool | null = null;

  static createPool(): Pool {
    if (!this.pool) {
      this.pool = new Pool({
        connectionString: getDatabaseUrl(),
        max: 10, // Maximum number of connections in pool
        idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
        connectionTimeoutMillis: 5000, // Return error after 5 seconds if connection could not be established
      });

      // Handle pool errors
      this.pool.on('error', (err: Error) => {
        console.error('Unexpected error on idle client', err);
        process.exit(-1);
      });
    }

    return this.pool;
  }

  static createUnitOfWork(): PgUnitOfWork {
    const pool = this.createPool();
    return new PgUnitOfWork(pool);
  }

  static async closePool(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}
