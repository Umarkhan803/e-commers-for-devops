import mongoose from 'mongoose'
import { ZodError } from 'zod'
import { ApiError } from '../utils/ApiError.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}`))
}

/** Maps framework and driver errors onto the API's error envelope. */
function normalise(error) {
  if (error instanceof ApiError) return error

  if (error instanceof ZodError) {
    return ApiError.unprocessable(
      'Request validation failed',
      error.issues.map((issue) => ({
        field: issue.path.join('.') || '(root)',
        message: issue.message,
      })),
    )
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return ApiError.unprocessable(
      'Document validation failed',
      Object.values(error.errors).map((entry) => ({
        field: entry.path,
        message: entry.message,
      })),
    )
  }

  if (error instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Malformed value for "${error.path}"`)
  }

  // Duplicate key on a unique index.
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern ?? {})[0] ?? 'field'
    return ApiError.conflict(`A record with that ${field} already exists`)
  }

  if (error.name === 'TokenExpiredError') return ApiError.unauthorized('Token has expired')
  if (error.name === 'JsonWebTokenError') return ApiError.unauthorized('Token is invalid')

  return new ApiError(500, 'Internal server error')
}

export function errorHandler(error, req, res, _next) {
  const normalised = normalise(error)

  if (normalised.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} → ${error.stack ?? error.message}`)
  }

  const body = {
    success: false,
    error: {
      message: normalised.message,
      statusCode: normalised.statusCode,
    },
  }
  if (normalised.details) body.error.details = normalised.details
  if (!env.isProduction && normalised.statusCode >= 500) body.error.stack = error.stack

  res.status(normalised.statusCode).json(body)
}
