import { Order } from '../../domain/entities/order.js'
import { SKU } from '../../domain/value-objects/sku.js'
import { Result } from '../../shared/result.js'
import { AppError } from '../errors.js'

export interface OrderRepository {
  save(order: Order): Promise<Result<void, AppError>>
  findById(sku: SKU): Promise<Result<Order, AppError>>
}