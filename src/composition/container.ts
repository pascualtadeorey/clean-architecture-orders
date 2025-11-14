import { InMemoryOrderRepository } from '../infrastructure/persistence/in-memory/in-memory-order-repository.js'
import { StaticPricingService } from '../infrastructure/http/StaticPricingService.js'
import { NoopEventBus } from '../infrastructure/messaging/NoopEventBus.js'
import { PinoLogger } from '../infrastructure/logging/pino-logger.js'
import { CreateOrder } from '../application/use-cases/create-order.js'
import { AddItemToOrder } from '../application/use-cases/add-item-to-order.js'
import { OrderRepository } from '../application/ports/order-repository.js'
import { PricingService } from '../application/ports/pricing-service.js'
import { EventBus } from '../application/ports/event-bus.js'
import { Logger } from '../application/ports/logger.js'
import { ServerDependencies } from '../application/ports/server-dependencies.js'

export interface Dependencies extends ServerDependencies {
  // Ports
  orderRepository: OrderRepository
  pricingService: PricingService
  eventBus: EventBus
  logger: Logger
}

export function buildContainer(): Dependencies {
  // Infrastructure layer - Adapters
  const orderRepository = new InMemoryOrderRepository()
  const pricingService = new StaticPricingService()
  const eventBus = new NoopEventBus()
  const logger = new PinoLogger()

  // Application layer - Use Cases
  const createOrderUseCase = new CreateOrder(orderRepository, eventBus)
  const addItemToOrderUseCase = new AddItemToOrder(orderRepository, pricingService, eventBus)

  return {
    // Ports
    orderRepository,
    pricingService,
    eventBus,
    logger,
    
    // Use Cases
    createOrderUseCase,
    addItemToOrderUseCase
  }
}