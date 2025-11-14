import { PinoLogger } from '../infrastructure/logging/pino-logger.js'

async function demonstrateLogging() {
  console.log('=== PinoLogger with Context Example ===\n')
  
  // 1. Create the main logger
  const rootLogger = new PinoLogger()
  
  // 2. Log some basic messages
  rootLogger.info('Application starting')
  rootLogger.debug('Debug information', { version: '1.0.0' })
  
  // 3. Create a request-scoped child logger
  const requestLogger = rootLogger.child({
    requestId: 'req-123',
    method: 'POST',
    url: '/orders',
    userAgent: 'curl/7.68.0'
  })
  
  requestLogger.info('Request started')
  
  // 4. Create operation-specific child logger
  const operationLogger = requestLogger.child({
    operation: 'createOrder',
    orderSku: 'order-456'
  })
  
  operationLogger.info('Creating order', { customerId: 'cust-789' })
  
  // 5. Simulate some operations
  try {
    operationLogger.info('Validating order data')
    // Simulate work...
    await new Promise(resolve => setTimeout(resolve, 100))
    
    operationLogger.info('Order validation successful')
    operationLogger.info('Saving order to database')
    
    // Simulate more work...
    await new Promise(resolve => setTimeout(resolve, 50))
    
    operationLogger.info('Order created successfully', { 
      orderId: 'ord-999',
      totalAmount: 99.99,
      currency: 'USD'
    })
  } catch (error) {
    operationLogger.error('Order creation failed', { 
      error: (error as Error).message,
      stack: (error as Error).stack
    })
  }
  
  requestLogger.info('Request completed', { 
    statusCode: 201,
    responseTimeMs: 150
  })
  
  console.log('\n=== Notice how each log entry includes the context! ===')
}

// Run example if this file is executed directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  demonstrateLogging().catch(console.error)
}