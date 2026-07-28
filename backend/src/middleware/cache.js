import { buildCatalogueKey, cacheGet, cacheSet } from '../services/cache.service.js'
import { isRedisReady } from '../config/redis.js'

/**
 * Caches successful GET responses in Redis and reports the outcome through the
 * `X-Cache` header (HIT, MISS or BYPASS) so cache behaviour is observable from
 * the browser network tab and from curl.
 */
export const cacheResponse = (namespace, ttlSeconds) => async (req, res, next) => {
  if (req.method !== 'GET' || !isRedisReady()) {
    res.set('X-Cache', 'BYPASS')
    return next()
  }

  const key = await buildCatalogueKey(namespace, req.originalUrl)

  const hit = await cacheGet(key)
  if (hit) {
    res.set('X-Cache', 'HIT')
    res.set('X-Cache-Key', key)
    return res.status(200).json(hit)
  }

  res.set('X-Cache', 'MISS')
  res.set('X-Cache-Key', key)

  const originalJson = res.json.bind(res)
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300 && body?.success) {
      void cacheSet(key, body, ttlSeconds)
    }
    return originalJson(body)
  }

  next()
}
