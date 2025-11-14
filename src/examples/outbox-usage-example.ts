import { MessagingFactory } from '../infrastructure/messaging/messaging-factory.js'
import { OrderCreated } from '../domain/events/order-created.js'

async function exampleEventBusUsage() {
  console.log('=== EventBus with Outbox Pattern Example ===\n')
  
  // 1. Create an EventBus that persists events to outbox
  const eventBus = MessagingFactory.createEventBus('outbox')
  
  // 2. Create some sample events
  const events = [
    new OrderCreated('order-123'),
    new OrderCreated('order-124')
  ]
  
  // 3. Publish events (they will be stored in outbox table)
  console.log('Publishing events to outbox...')
  const result = await eventBus.publish(events)
  
  if (result.isSuccess) {
    console.log('✅ Events successfully stored in outbox table')
  } else {
    console.log('❌ Failed to store events:', result.error.message)
  }
  
  console.log('\n=== OutboxDispatcher Example ===\n')
  
  // 4. Create and start the dispatcher
  console.log('Creating outbox dispatcher...')
  const dispatcher = MessagingFactory.createOutboxDispatcher(10, 2000) // batch size 10, check every 2 seconds
  
  console.log('Starting dispatcher (will process unpublished events)...')
  console.log('Press Ctrl+C to stop\n')
  
  // Start the dispatcher (this will run indefinitely)
  await dispatcher.start()
}

// Run example if this file is executed directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  exampleEventBusUsage().catch(console.error)
}