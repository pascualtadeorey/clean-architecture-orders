import { DomainEvent } from '../../domain/events/domain-event.js'
import { Result, ok } from '../../shared/result.js'
import { EventBus } from '../../application/ports/event-bus.js'
import { AppError } from '../../application/errors.js'

export class NoopEventBus implements EventBus {
  async publish(_events: DomainEvent[]): Promise<Result<void, AppError>> {
    return ok(undefined)
  }
}