import { FastifyInstance, FastifyRequest } from 'fastify'
import { randomUUID } from 'crypto'
import { Logger } from '../../../application/ports/logger.js'

declare module 'fastify' {
  interface FastifyRequest {
    logger: Logger
  }
}

export async function loggingPlugin(fastify: FastifyInstance, opts: { logger: Logger }) {
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    const requestId = randomUUID()
    
    request.logger = opts.logger.child({
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent']
    })

    request.logger.info('Request started')
  })

  fastify.addHook('onResponse', async (request: FastifyRequest, reply) => {
    const responseTime = reply.getResponseTime()
    
    request.logger.info('Request completed', {
      statusCode: reply.statusCode,
      responseTimeMs: Math.round(responseTime)
    })
  })

  fastify.addHook('onError', async (request: FastifyRequest, reply, error) => {
    request.logger.error('Request failed', {
      error: error.message,
      stack: error.stack,
      statusCode: reply.statusCode
    })
  })
}