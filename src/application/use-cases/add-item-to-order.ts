import { SKU } from '../../domain/value-objects/sku.js'
import { Quantity } from '../../domain/value-objects/quantity.js'
import { Result, ok, fail } from '../../shared/result.js'
import { OrderRepository } from '../ports/order-repository.js'
import { PricingService } from '../ports/pricing-service.js'
import { EventBus } from '../ports/event-bus.js'
import { AddItemToOrderDto } from '../dto/add-item-to-order-dto.js'
import { AppError, ValidationError } from '../errors.js'

export class AddItemToOrder {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly pricingService: PricingService,
    private readonly eventBus: EventBus
  ) {}

  async execute(dto: AddItemToOrderDto): Promise<Result<void, AppError>> {
    try {
      const orderSku = new SKU(dto.orderSku)
      const productSku = new SKU(dto.productSku)
      const quantity = new Quantity(dto.quantity)

      const orderResult = await this.orderRepository.findById(orderSku)
      if (!orderResult.success) {
        return fail(orderResult.error)
      }
      
      const order = orderResult.data
      
      const priceResult = await this.pricingService.getPrice(productSku)
      if (!priceResult.success) {
        return fail(priceResult.error)
      }
      
      const unitPrice = priceResult.data

      order.addItem(productSku, quantity, unitPrice)
      
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