import { SKU } from '../value-objects/sku.js'
import { OrderItem } from '../value-objects/order-item.js'
import { Money } from '../value-objects/money.js'
import { Quantity } from '../value-objects/quantity.js'
import { DomainEvent } from '../events/domain-event.js'
import { OrderCreated } from '../events/order-created.js'
import { ItemAddedToOrder } from '../events/item-added-to-order.js'

export class Order {
  private readonly _sku: SKU
  private readonly _items: Map<string, OrderItem> = new Map()
  private readonly _events: DomainEvent[] = []

  constructor(sku: SKU) {
    this._sku = sku
    this._events.push(new OrderCreated(sku.value))
  }

  get sku(): SKU {
    return this._sku
  }

  get items(): OrderItem[] {
    return Array.from(this._items.values())
  }

  get events(): DomainEvent[] {
    return [...this._events]
  }

  addItem(productSku: SKU, quantity: Quantity, unitPrice: Money): void {
    const existingItem = this._items.get(productSku.value)
    
    if (existingItem) {
      if (!existingItem.unitPrice.equals(unitPrice)) {
        throw new Error('Cannot add item with different unit price')
      }
      const updatedItem = existingItem.increaseQuantity(quantity)
      this._items.set(productSku.value, updatedItem)
    } else {
      const newItem = new OrderItem(productSku, quantity, unitPrice)
      this._items.set(productSku.value, newItem)
    }

    this._events.push(new ItemAddedToOrder(
      this._sku.value,
      productSku.value,
      quantity.value,
      unitPrice.amount,
      unitPrice.currency.code
    ))
  }

  getTotalByCurrency(): Map<string, Money> {
    const totals = new Map<string, Money>()

    for (const item of this._items.values()) {
      const currencyCode = item.unitPrice.currency.code
      const itemTotal = item.totalPrice
      
      if (totals.has(currencyCode)) {
        const currentTotal = totals.get(currencyCode)!
        totals.set(currencyCode, currentTotal.add(itemTotal))
      } else {
        totals.set(currencyCode, itemTotal)
      }
    }

    return totals
  }

  clearEvents(): void {
    this._events.length = 0
  }
}