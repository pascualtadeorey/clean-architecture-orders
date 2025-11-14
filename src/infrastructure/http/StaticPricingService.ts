import { SKU } from '../../domain/value-objects/sku.js'
import { Money } from '../../domain/value-objects/money.js'
import { Currency } from '../../domain/value-objects/currency.js'
import { Result, ok, fail } from '../../shared/result.js'
import { PricingService } from '../../application/ports/pricing-service.js'
import { AppError, NotFoundError, InfraError } from '../../application/errors.js'

export class StaticPricingService implements PricingService {
  private readonly prices = new Map<string, { amount: number; currency: string }>([
    ['LAPTOP-001', { amount: 999.99, currency: 'USD' }],
    ['MOUSE-001', { amount: 29.99, currency: 'USD' }],
    ['KEYBOARD-001', { amount: 79.99, currency: 'USD' }],
    ['MONITOR-001', { amount: 299.99, currency: 'USD' }],
    ['HEADPHONES-001', { amount: 149.99, currency: 'USD' }],
    ['TABLET-001', { amount: 499.99, currency: 'EUR' }],
    ['PHONE-001', { amount: 799.99, currency: 'EUR' }],
    ['SPEAKER-001', { amount: 89.99, currency: 'GBP' }]
  ])

  async getPrice(productSku: SKU): Promise<Result<Money, AppError>> {
    try {
      const priceData = this.prices.get(productSku.value)
      
      if (!priceData) {
        return fail(new NotFoundError('Product price', productSku.value))
      }

      const currency = new Currency(priceData.currency)
      const money = new Money(priceData.amount, currency)
      
      return ok(money)
    } catch (error) {
      return fail(new InfraError('Failed to get product price', error instanceof Error ? error : undefined))
    }
  }
}