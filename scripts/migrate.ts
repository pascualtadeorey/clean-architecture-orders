import { Client } from 'pg';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config, getDatabaseUrl } from '../src/composition/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  const client = new Client({
    connectionString: getDatabaseUrl(),
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    // Get list of executed migrations
    const executedResult = await client.query(
      'SELECT filename FROM migrations ORDER BY executed_at'
    );
    const executedMigrations = new Set(executedResult.rows.map(row => row.filename));

    // Migration files to run
    const migrationFiles = ['001_init.sql'];

    for (const filename of migrationFiles) {
      if (executedMigrations.has(filename)) {
        console.log(`Skipping already executed migration: ${filename}`);
        continue;
      }

      console.log(`Running migration: ${filename}`);
      
      const migrationPath = join(__dirname, '..', 'db', 'migrations', filename);
      const migrationSql = await readFile(migrationPath, 'utf-8');
      
      await client.query('BEGIN');
      
      try {
        await client.query(migrationSql);
        await client.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [filename]
        );
        await client.query('COMMIT');
        console.log(`✅ Migration ${filename} completed successfully`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Migration ${filename} failed:`, error);
        throw error;
      }
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
