import { DomainEvent } from '../../domain/events/domain-event.js'
import { Result } from '../../shared/result.js'
import { AppError } from '../errors.js'

export interface EventBus {
  publish(events: DomainEvent[]): Promise<Result<void, AppError>>
}