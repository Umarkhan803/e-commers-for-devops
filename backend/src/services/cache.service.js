import { createHash } from 'node:crypto'
import { redis, isRedisReady } from '../config/redis.js'
import { logger } from '../utils/logger.js'

const PREFIX = 'nova'
const VERSION_KEY = `${PREFIX}:catalogue:version`

/**
 * Catalogue caches are invalidated by version bump rather than key scanning:
 * every catalogue cache key embeds the current version, so incrementing it
 * orphans the whole generation at once in O(1). Orphans expire on their own TTL.
 */
let cachedVersion = null

export async function catalogueVersion() {
  if (cachedVersion !== null) return cachedVersion
  if (!isRedisReady()) return 0

  try {
    const value = await redis.get(VERSION_KEY)
    if (value === null) {
      await redis.set(VERSION_KEY, '1')
      cachedVersion = 1
    } else {
      cachedVersion = Number(value)
    }
    return cachedVersion
  } catch {
    return 0
  }
}

export async function bumpCatalogueVersion() {
  if (!isRedisReady()) return
  try {
    cachedVersion = await redis.incr(VERSION_KEY)
    logger.info(`Catalogue cache invalidated (version ${cachedVersion})`)
  } catch (error) {
    logger.warn(`Could not bump catalogue version: ${error.message}`)
  }
}

export function hashKey(value) {
  return createHash('sha1').update(value).digest('hex').slice(0, 16)
}

export async function buildCatalogueKey(namespace, discriminator) {
  const version = await catalogueVersion()
  return `${PREFIX}:${namespace}:v${version}:${hashKey(discriminator)}`
}

export async function cacheGet(key) {
  if (!isRedisReady()) return null
  try {
    const raw = await redis.get(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function cacheSet(key, value, ttlSeconds) {
  if (!isRedisReady()) return
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch {
    /* a cache write failure must never fail the request */
  }
}

export async function cacheDelete(key) {
  if (!isRedisReady()) return
  try {
    await redis.del(key)
  } catch {
    /* ignore */
  }
}

/** Read-through helper for service-layer caching. */
export async function remember(key, ttlSeconds, producer) {
  const hit = await cacheGet(key)
  if (hit !== null) return { value: hit, cached: true }

  const value = await producer()
  await cacheSet(key, value, ttlSeconds)
  return { value, cached: false }
}
