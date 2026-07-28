import { redis, isRedisReady } from '../config/redis.js'
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

/**
 * Fixed-window rate limiter backed by Redis, so the limit is shared across
 * every API instance behind Nginx rather than being per-process. Requests pass
 * through untouched when Redis is unavailable.
 */
export const rateLimit = ({
  max = env.rateLimit.max,
  windowSeconds = env.rateLimit.windowSeconds,
  bucket = 'global',
} = {}) => async (req, res, next) => {
  if (!isRedisReady()) return next()

  const identifier = req.user?.id ?? req.ip
  const window = Math.floor(Date.now() / 1000 / windowSeconds)
  const key = `nova:ratelimit:${bucket}:${identifier}:${window}`

  try {
    const [[, hits]] = await redis
      .multi()
      .incr(key)
      .expire(key, windowSeconds)
      .exec()

    const remaining = Math.max(0, max - hits)
    res.set('X-RateLimit-Limit', String(max))
    res.set('X-RateLimit-Remaining', String(remaining))
    res.set('X-RateLimit-Reset', String((window + 1) * windowSeconds))

    if (hits > max) {
      res.set('Retry-After', String(windowSeconds))
      return next(
        ApiError.tooManyRequests(
          `Rate limit of ${max} requests per ${windowSeconds}s exceeded. Try again shortly.`,
        ),
      )
    }
  } catch {
    /* limiter failure must not block traffic */
  }

  next()
}
