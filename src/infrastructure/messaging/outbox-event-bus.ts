import { Pool } from 'pg'
import { randomUUID, createHash } from 'crypto'
import { DomainEvent } from '../../domain/events/domain-event.js'
import { Result, ok, fail } from '../../shared/result.js'
import { EventBus } from '../../application/ports/event-bus.js'
import { AppError, InfraError } from '../../application/errors.js'

interface OutboxRecord {
  id: string
  aggregate_id: string
  aggregate_type: string
  event_type: string
  event_data: object
  created_at: Date
}

export class OutboxEventBus implements EventBus {
  constructor(private readonly pool: Pool) {}

  async publish(events: DomainEvent[]): Promise<Result<void, AppError>> {
    if (events.length === 0) {
      return ok(undefined)
    }

    const client = await this.pool.connect()
    
    try {
      const outboxRecords: OutboxRecord[] = events.map(event => ({
        id: randomUUID(),
        aggregate_id: this.generateUuidFromSku(event.aggregateId),
        aggregate_type: this.extractAggregateType(event),
        event_type: event.constructor.name,
        event_data: this.serializeEvent(event),
        created_at: event.occurredOn
      }))

      const query = `
        INSERT INTO outbox (id, aggregate_id, aggregate_type, event_type, event_data, created_at)
        VALUES ${outboxRecords.map((_, index) => 
          `($${index * 6 + 1}, $${index * 6 + 2}, $${index * 6 + 3}, $${index * 6 + 4}, $${index * 6 + 5}, $${index * 6 + 6})`
        ).join(', ')}
      `

      const params = outboxRecords.flatMap(record => [
        record.id,
        record.aggregate_id,
        record.aggregate_type,
        record.event_type,
        JSON.stringify(record.event_data),
        record.created_at
      ])

      await client.query(query, params)
      
      return ok(undefined)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown outbox persistence error'
      return fail(new InfraError(`Failed to persist events to outbox: ${errorMessage}`))
    } finally {
      client.release()
    }
  }

  private extractAggregateType(event: DomainEvent): string {
    const eventName = event.constructor.name
    
    if (eventName.includes('Order')) {
      return 'Order'
    }
    
    return 'Unknown'
  }

  private serializeEvent(event: DomainEvent): object {
    return {
      aggregateId: event.aggregateId,
      occurredOn: event.occurredOn.toISOString(),
      ...this.getEventPayload(event)
    }
  }

  private getEventPayload(event: DomainEvent): object {
    const payload = { ...event }
    
    delete (payload as any).aggregateId
    delete (payload as any).occurredOn
    
    return payload
  }

  private generateUuidFromSku(sku: string): string {
    // Create a deterministic UUID based on SKU using hash
    const hash = createHash('sha256').update(sku).digest('hex');
    // Format as UUID v4
    return [
      hash.substring(0, 8),
      hash.substring(8, 12),
      '4' + hash.substring(13, 16), // Version 4
      '8' + hash.substring(17, 20), // Variant bits
      hash.substring(20, 32)
    ].join('-');
  }
}