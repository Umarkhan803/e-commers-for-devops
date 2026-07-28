import { createApp } from './app.js'
import { env } from './config/env.js'
import { connectMongo, disconnectMongo } from './config/mongo.js'
import { connectRedis, disconnectRedis } from './config/redis.js'
import { logger } from './utils/logger.js'

async function start() {
  await connectMongo()
  await connectRedis()

  const app = createApp()
  const server = app.listen(env.port, () => {
    logger.info(`API listening on http://localhost:${env.port}${env.apiPrefix}`)
  })

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down`)
    server.close(async () => {
      await Promise.allSettled([disconnectMongo(), disconnectRedis()])
      process.exit(0)
    })
    // Do not hang forever on lingering keep-alive connections.
    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))
}

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason instanceof Error ? reason.stack : reason}`)
})

start().catch((error) => {
  logger.error(`Failed to start: ${error.message}`)
  process.exit(1)
})
