import { SKU } from './sku.js'
import { Quantity } from './quantity.js'
import { Money } from './money.js'

export class OrderItem {
  private readonly _productSku: SKU
  private readonly _quantity: Quantity
  private readonly _unitPrice: Money

  constructor(productSku: SKU, quantity: Quantity, unitPrice: Money) {
    this._productSku = productSku
    this._quantity = quantity
    this._unitPrice = unitPrice
  }

  get productSku(): SKU {
    return this._productSku
  }

  get quantity(): Quantity {
    return this._quantity
  }

  get unitPrice(): Money {
    return this._unitPrice
  }

  get totalPrice(): Money {
    return this._unitPrice.multiply(this._quantity.value)
  }

  increaseQuantity(additionalQuantity: Quantity): OrderItem {
    return new OrderItem(
      this._productSku,
      this._quantity.add(additionalQuantity),
      this._unitPrice
    )
  }

  equals(other: OrderItem): boolean {
    return this._productSku.equals(other._productSku) &&
           this._quantity.equals(other._quantity) &&
           this._unitPrice.equals(other._unitPrice)
  }
}