import { DomainEvent } from './domain-event.js'

export class ItemAddedToOrder extends DomainEvent {
  readonly productSku: string
  readonly quantity: number
  readonly unitPrice: number
  readonly currency: string

  constructor(
    orderSku: string,
    productSku: string,
    quantity: number,
    unitPrice: number,
    currency: string
  ) {
    super(orderSku)
    this.productSku = productSku
    this.quantity = quantity
    this.unitPrice = unitPrice
    this.currency = currency
  }
}