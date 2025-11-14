import { Order } from '../../../domain/entities/order.js'
import { SKU } from '../../../domain/value-objects/sku.js'
import { Result, ok, fail } from '../../../shared/result.js'
import { OrderRepository } from '../../../application/ports/order-repository.js'
import { AppError, NotFoundError, InfraError } from '../../../application/errors.js'

export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>()

  async save(order: Order): Promise<Result<void, AppError>> {
    try {
      const clonedOrder = this.cloneOrder(order)
      this.orders.set(order.sku.value, clonedOrder)
      return ok(undefined)
    } catch (error) {
      return fail(new InfraError('Failed to save order', error instanceof Error ? error : undefined))
    }
  }

  async findById(sku: SKU): Promise<Result<Order, AppError>> {
    try {
      const order = this.orders.get(sku.value)
      if (!order) {
        return fail(new NotFoundError('Order', sku.value))
      }
      return ok(this.cloneOrder(order))
    } catch (error) {
      return fail(new InfraError('Failed to find order', error instanceof Error ? error : undefined))
    }
  }

  private cloneOrder(order: Order): Order {
    const cloned = new Order(order.sku)
    for (const item of order.items) {
      cloned.addItem(item.productSku, item.quantity, item.unitPrice)
    }
    cloned.clearEvents()
    return cloned
  }
}