/** Wraps an async route handler so rejections reach the error middleware. */
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next)

/** Every successful response uses this envelope. */
export function sendSuccess(res, data, { status = 200, meta } = {}) {
  const body = { success: true, data }
  if (meta) body.meta = meta
  return res.status(status).json(body)
}

export function buildPageMeta({ page, limit, total }) {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}
