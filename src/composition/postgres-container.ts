import { StaticPricingService } from '../infrastructure/http/StaticPricingService.js';
import { NoopEventBus } from '../infrastructure/messaging/NoopEventBus.js';
import { PinoLogger } from '../infrastructure/logging/pino-logger.js';
import { CreateOrderWithUoW } from '../application/use-cases/create-order-with-uow.js';
import { PricingService } from '../application/ports/pricing-service.js';
import { EventBus } from '../application/ports/event-bus.js';
import { Logger } from '../application/ports/logger.js';
import { UnitOfWork } from '../application/ports/unit-of-work.js';
import { DatabaseFactory } from '../infrastructure/database/database-factory.js';

export interface PostgresDependencies {
  // Ports
  unitOfWork: UnitOfWork;
  pricingService: PricingService;
  eventBus: EventBus;
  logger: Logger;
  
  // Use Cases
  createOrderUseCase: CreateOrderWithUoW;
}

export function buildPostgresContainer(): PostgresDependencies {
  // Infrastructure layer - Adapters
  const unitOfWork = DatabaseFactory.createUnitOfWork();
  const pricingService = new StaticPricingService();
  const eventBus = new NoopEventBus();
  const logger = new PinoLogger();

  // Application layer - Use Cases
  const createOrderUseCase = new CreateOrderWithUoW(unitOfWork, eventBus);

  return {
    // Ports
    unitOfWork,
    pricingService,
    eventBus,
    logger,
    
    // Use Cases
    createOrderUseCase,
  };
}

// Cleanup function for graceful shutdown
export async function closeContainer(): Promise<void> {
  await DatabaseFactory.closePool();
}
