import { Pool } from 'pg'
import { DatabaseFactory } from '../database/database-factory.js'

interface OutboxEvent {
  id: string
  aggregate_id: string
  aggregate_type: string
  event_type: string
  event_data: object
  created_at: Date
}

export class OutboxDispatcher {
  private readonly pool: Pool
  private isRunning = false
  private batchSize: number
  private intervalMs: number

  constructor(batchSize = 100, intervalMs = 5000) {
    this.pool = DatabaseFactory.createPool()
    this.batchSize = batchSize
    this.intervalMs = intervalMs
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Outbox dispatcher is already running')
      return
    }

    this.isRunning = true
    console.log('Starting outbox dispatcher...')

    while (this.isRunning) {
      try {
        await this.processUnpublishedEvents()
        await this.sleep(this.intervalMs)
      } catch (error) {
        console.error('Error in outbox dispatcher:', error)
        await this.sleep(this.intervalMs)
      }
    }
  }

  stop(): void {
    console.log('Stopping outbox dispatcher...')
    this.isRunning = false
  }

  private async processUnpublishedEvents(): Promise<void> {
    const client = await this.pool.connect()
    
    try {
      await client.query('BEGIN')

      const selectQuery = `
        SELECT id, aggregate_id, aggregate_type, event_type, event_data, created_at
        FROM outbox
        WHERE published_at IS NULL
        ORDER BY created_at ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      `

      const result = await client.query(selectQuery, [this.batchSize])
      const events: OutboxEvent[] = result.rows

      if (events.length === 0) {
        await client.query('COMMIT')
        return
      }

      console.log(`Processing ${events.length} unpublished events`)

      for (const event of events) {
        try {
          await this.publishEvent(event)
          console.log(`Published event ${event.id} of type ${event.event_type}`)
        } catch (error) {
          console.error(`Failed to publish event ${event.id}:`, error)
          throw error
        }
      }

      const eventIds = events.map(e => e.id)
      const updateQuery = `
        UPDATE outbox 
        SET published_at = NOW()
        WHERE id = ANY($1)
      `

      await client.query(updateQuery, [eventIds])
      await client.query('COMMIT')

      console.log(`Marked ${events.length} events as published`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  private async publishEvent(event: OutboxEvent): Promise<void> {
    console.log(`Publishing event: ${event.event_type} for aggregate ${event.aggregate_type}:${event.aggregate_id}`)
    
    // Here you would integrate with your actual message broker (RabbitMQ, Apache Kafka, AWS SQS, etc.)
    // For now, we'll just log the event
    console.log('Event data:', JSON.stringify(event.event_data, null, 2))
    
    // Simulate async publishing
    await this.sleep(10)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// CLI runner for the dispatcher
async function runDispatcher() {
  const dispatcher = new OutboxDispatcher()
  
  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...')
    dispatcher.stop()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...')
    dispatcher.stop()
    process.exit(0)
  })

  try {
    await dispatcher.start()
  } catch (error) {
    console.error('Failed to start outbox dispatcher:', error)
    process.exit(1)
  }
}

// Run the dispatcher if this file is executed directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  runDispatcher()
}