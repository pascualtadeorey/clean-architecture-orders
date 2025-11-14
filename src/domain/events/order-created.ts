import { DomainEvent } from './domain-event.js'

export class OrderCreated extends DomainEvent {
  constructor(orderSku: string) {
    super(orderSku)
  }
}