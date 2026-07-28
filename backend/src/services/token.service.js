import { randomUUID } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { redis, isRedisReady } from '../config/redis.js'
import { ApiError } from '../utils/ApiError.js'

const refreshKey = (userId, tokenId) => `nova:refresh:${userId}:${tokenId}`

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessTtl },
  )
}

/**
 * Refresh tokens are whitelisted in Redis rather than merely signed, which makes
 * logout and "sign out everywhere" genuinely revoke access instead of waiting
 * for the token to expire.
 */
export async function issueRefreshToken(user) {
  const tokenId = randomUUID()
  const token = jwt.sign({ sub: user.id, jti: tokenId }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshTtl,
  })

  if (isRedisReady()) {
    await redis.set(refreshKey(user.id, tokenId), '1', 'EX', env.jwt.refreshTtlSeconds)
  }

  return token
}

export async function rotateRefreshToken(token) {
  let payload
  try {
    payload = jwt.verify(token, env.jwt.refreshSecret)
  } catch {
    throw ApiError.unauthorized('Refresh token is invalid or has expired')
  }

  if (isRedisReady()) {
    const exists = await redis.del(refreshKey(payload.sub, payload.jti))
    if (exists === 0) throw ApiError.unauthorized('Refresh token has already been used or revoked')
  }

  return payload
}

export async function revokeRefreshToken(token) {
  if (!token) return
  try {
    const payload = jwt.verify(token, env.jwt.refreshSecret, { ignoreExpiration: true })
    if (isRedisReady()) await redis.del(refreshKey(payload.sub, payload.jti))
  } catch {
    /* nothing to revoke */
  }
}

export async function revokeAllRefreshTokens(userId) {
  if (!isRedisReady()) return
  const pattern = `nova:refresh:${userId}:*`
  const stream = redis.scanStream({ match: pattern, count: 100 })
  for await (const keys of stream) {
    if (keys.length) await redis.del(...keys)
  }
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret)
}

export const REFRESH_COOKIE = 'nova_refresh'

export const refreshCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProduction,
  path: '/',
  maxAge: env.jwt.refreshTtlSeconds * 1000,
}
