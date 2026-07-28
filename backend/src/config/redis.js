import Redis from 'ioredis'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

/**
 * Redis is treated as an accelerator, not a dependency. Caching and rate
 * limiting degrade to pass-through when the connection is down so a Redis
 * outage slows the API rather than taking it offline. Refresh-token storage is
 * the one feature that genuinely requires it.
 */
export const redis = new Redis(env.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
  enableOfflineQueue: false,
  retryStrategy: (attempt) => Math.min(attempt * 200, 5000),
})

let ready = false
let loggedFailure = false

redis.on('ready', () => {
  ready = true
  loggedFailure = false
  logger.info(`Redis connected → ${env.redisUrl.replace(/\/\/.*@/, '//')}`)
})

redis.on('end', () => {
  ready = false
})

redis.on('error', (error) => {
  ready = false
  if (!loggedFailure) {
    loggedFailure = true
    logger.warn(`Redis unavailable (caching disabled): ${error.message}`)
  }
})

export async function connectRedis() {
  try {
    await redis.connect()
  } catch (error) {
    logger.warn(`Redis initial connect failed, continuing without cache: ${error.message}`)
  }
}

export const isRedisReady = () => ready

export async function disconnectRedis() {
  if (redis.status === 'end') return
  try {
    await redis.quit()
  } catch {
    redis.disconnect()
  }
}

export async function redisHealth() {
  if (!ready) return { status: 'unavailable' }
  try {
    const start = Date.now()
    await redis.ping()
    return { status: 'connected', latencyMs: Date.now() - start }
  } catch (error) {
    return { status: 'error', message: error.message }
  }
}
