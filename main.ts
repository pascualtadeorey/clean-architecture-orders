import { buildServer } from './src/infrastructure/http/server.js'
import { buildUnifiedContainer } from './src/composition/unified-container.js'
import { config } from './src/composition/config.js'
import { FastifyInstance } from 'fastify'

let server: FastifyInstance | null = null
let dependencies: Awaited<ReturnType<typeof buildUnifiedContainer>> | null = null

async function main() {
  try {
    console.log(`🚀 Starting application in ${config.NODE_ENV} mode`)
    console.log(`📊 Database type: ${config.DATABASE_TYPE}`)
    
    // Composition Root - Dependency Injection
    dependencies = buildUnifiedContainer()
    dependencies.logger.info('Dependencies initialized')
    
    // Build server with injected dependencies
    server = await buildServer(dependencies)
    dependencies.logger.info('Server built successfully')
    
    const host = process.env.HOST || '0.0.0.0'
    const port = config.PORT
    
    await server.listen({ host, port })
    
    dependencies.logger.info('Server started successfully', { host, port })
    console.log(`🚀 Server running at http://${host}:${port}`)
    console.log(`📋 Health check: http://${host}:${port}/health`)
    console.log(`📦 Orders API: http://${host}:${port}/orders`)
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    if (dependencies?.logger) {
      dependencies.logger.error('Server startup failed', { error: (error as Error).message })
    }
    await cleanup()
    process.exit(1)
  }
}

async function cleanup() {
  console.log('🧹 Starting cleanup process...')
  
  try {
    // Close server
    if (server) {
      console.log('📡 Closing HTTP server...')
      await server.close()
      console.log('✅ HTTP server closed')
    }
    
    // Cleanup dependencies (database connections, etc.)
    if (dependencies?.cleanup) {
      console.log('🗃️ Cleaning up dependencies...')
      await dependencies.cleanup()
      console.log('✅ Dependencies cleaned up')
    }
    
    console.log('✅ Cleanup completed successfully')
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    if (dependencies?.logger) {
      dependencies.logger.error('Cleanup failed', { error: (error as Error).message })
    }
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...')
  if (dependencies?.logger) {
    dependencies.logger.info('SIGTERM received, initiating graceful shutdown')
  }
  await cleanup()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...')
  if (dependencies?.logger) {
    dependencies.logger.info('SIGINT received, initiating graceful shutdown')
  }
  await cleanup()
  process.exit(0)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Promise Rejection:', reason)
  if (dependencies?.logger) {
    dependencies.logger.error('Unhandled promise rejection', { 
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined
    })
  }
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error)
  if (dependencies?.logger) {
    dependencies.logger.error('Uncaught exception', { 
      error: error.message,
      stack: error.stack
    })
  }
  cleanup().finally(() => {
    process.exit(1)
  })
})

main().catch(async (error) => {
  console.error('💥 Unhandled error in main:', error)
  if (dependencies?.logger) {
    dependencies.logger.error('Main function failed', { error: error.message })
  }
  await cleanup()
  process.exit(1)
})