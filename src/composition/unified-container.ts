import { config, useInMemoryDatabase, usePostgresDatabase } from './config.js'
import { buildContainer } from './container.js'
import { buildPostgresContainer, closeContainer as closePostgresContainer } from './postgres-container.js'
import { StaticPricingService } from '../infrastructure/http/StaticPricingService.js'
import { AddItemToOrder } from '../application/use-cases/add-item-to-order.js'
import { CreateOrder } from '../application/use-cases/create-order.js'
import { MessagingFactory } from '../infrastructure/messaging/messaging-factory.js'
import { ServerDependencies } from '../application/ports/server-dependencies.js'
import { PinoLogger } from '../infrastructure/logging/pino-logger.js'
import { DatabaseFactory } from '../infrastructure/database/database-factory.js'
import { PostgresOrderRepository } from '../infrastructure/persistence/postgres/postgres-order-repository.js'

export interface UnifiedDependencies extends ServerDependencies {
  cleanup?: () => Promise<void>
}

export function buildUnifiedContainer(): UnifiedDependencies {
  const logger = new PinoLogger()
  
  if (useInMemoryDatabase()) {
    logger.info('Using in-memory database')
    const dependencies = buildContainer()
    
    return {
      ...dependencies,
      logger,
      cleanup: async () => {
        logger.info('Cleaning up in-memory dependencies')
        // No cleanup needed for in-memory
      }
    }
  }
  
  if (usePostgresDatabase()) {
    logger.info('Using PostgreSQL database')
    const postgresDependencies = buildPostgresContainer()
    
    // Create missing dependencies for server compatibility
    const pricingService = new StaticPricingService()
    const eventBus = MessagingFactory.createEventBus('outbox')
    
    // Create a shared PostgreSQL repository for non-UoW operations  
    const pool = DatabaseFactory.createPool()
    // For simplicity, we'll use the pool directly, but need to cast it
    const orderRepository = new PostgresOrderRepository(pool as any)
    
    // Create AddItemToOrder use case with actual repository
    const addItemToOrderUseCase = new AddItemToOrder(
      orderRepository,
      pricingService,
      eventBus
    )
    
    // Create adapter that extends CreateOrder for compatibility
    const createOrderUseCase = new CreateOrder(
      null as any, // Not used in UoW version
      eventBus
    )
    
    // Override execute method to use the UoW implementation
    createOrderUseCase.execute = postgresDependencies.createOrderUseCase.execute.bind(postgresDependencies.createOrderUseCase)
    
    return {
      createOrderUseCase,
      addItemToOrderUseCase,
      logger: postgresDependencies.logger,
      cleanup: async () => {
        logger.info('Cleaning up PostgreSQL dependencies')
        await closePostgresContainer()
      }
    }
  }
  
  throw new Error(`Unsupported database type: ${config.DATABASE_TYPE}`)
}