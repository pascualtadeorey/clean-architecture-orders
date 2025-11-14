import { Order } from '../../domain/entities/order.js'
import { SKU } from '../../domain/value-objects/sku.js'
import { Result, ok, fail } from '../../shared/result.js'
import { OrderRepository } from '../ports/order-repository.js'
import { EventBus } from '../ports/event-bus.js'
import { CreateOrderDto } from '../dto/create-order-dto.js'
import { AppError, ValidationError, ConflictError } from '../errors.js'

export class CreateOrder {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(dto: CreateOrderDto): Promise<Result<void, AppError>> {
    try {
      const orderSku = new SKU(dto.orderSku)
      
      const existingOrderResult = await this.orderRepository.findById(orderSku)
      if (existingOrderResult.success) {
        return fail(new ConflictError(`Order with SKU '${dto.orderSku}' already exists`))
      }
      
      if (existingOrderResult.error.type !== 'NOT_FOUND_ERROR') {
        return fail(existingOrderResult.error)
      }

      const order = new Order(orderSku)
      
      const saveResult = await this.orderRepository.save(order)
      if (!saveResult.success) {
        return fail(saveResult.error)
      }

      const publishResult = await this.eventBus.publish(order.events)
      if (!publishResult.success) {
        return fail(publishResult.error)
      }

      return ok(undefined)
    } catch (error) {
      if (error instanceof Error) {
        return fail(new ValidationError(error.message))
      }
      return fail(new ValidationError('Unknown validation error'))
    }
  }
}