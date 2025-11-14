import { SKU } from '../../domain/value-objects/sku.js'
import { Money } from '../../domain/value-objects/money.js'
import { Result } from '../../shared/result.js'
import { AppError } from '../errors.js'

export interface PricingService {
  getPrice(productSku: SKU): Promise<Result<Money, AppError>>
}