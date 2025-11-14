import { Pool } from 'pg';
import { UnitOfWork, Repositories } from '../../../application/ports/unit-of-work.js';
import { PostgresOrderRepository } from './postgres-order-repository.js';
import { Result, ok, fail } from '../../../shared/result.js';
import { AppError, InfraError } from '../../../application/errors.js';

export class PgUnitOfWork implements UnitOfWork {
  constructor(private readonly pool: Pool) {}

  async run<T>(fn: (repos: Repositories) => Promise<T>): Promise<Result<T, AppError>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create repositories that share the same connection/transaction
      const repositories: Repositories = {
        orderRepository: new PostgresOrderRepository(client),
      };
      
      // Execute the business logic
      const result = await fn(repositories);
      
      await client.query('COMMIT');
      
      return ok(result);
    } catch (error) {
      await client.query('ROLLBACK');
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown transaction error';
      return fail(new InfraError(`Transaction failed: ${errorMessage}`));
    } finally {
      client.release();
    }
  }
}
