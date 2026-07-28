import { verifyAccessToken } from '../services/token.service.js'
import { ApiError } from '../utils/ApiError.js'

function readToken(req) {
  const header = req.headers.authorization ?? ''
  if (header.toLowerCase().startsWith('bearer ')) return header.slice(7).trim()
  return null
}

function decode(req) {
  const token = readToken(req)
  if (!token) return null
  const payload = verifyAccessToken(token)
  return { id: payload.sub, email: payload.email, name: payload.name, role: payload.role }
}

/** Rejects the request unless a valid access token is present. */
export function requireAuth(req, _res, next) {
  try {
    const user = decode(req)
    if (!user) throw ApiError.unauthorized('Sign in to continue')
    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Attaches `req.user` when a valid token is present and moves on otherwise.
 * Used by endpoints that serve guests and signed-in shoppers alike, such as the
 * cart, where a guest basket is keyed by session id instead.
 */
export function optionalAuth(req, _res, next) {
  try {
    req.user = decode(req)
  } catch {
    req.user = null
  }
  next()
}

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized('Sign in to continue'))
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden())
  next()
}
