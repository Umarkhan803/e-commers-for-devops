import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { cacheResponse } from '../middleware/cache.js'
import { requireAuth } from '../middleware/auth.js'
import { env } from '../config/env.js'
import {
  productQuerySchema,
  suggestQuerySchema,
  slugParamSchema,
  reviewBodySchema,
} from '../validators/product.validators.js'
import {
  listProducts,
  listFilters,
  suggestProducts,
  getProduct,
  getRelated,
  listReviews,
  createReview,
} from '../controllers/product.controller.js'

const router = Router()

/**
 * Static segments are registered before `/:slug` so that "filters" and "suggest"
 * are not swallowed by the slug parameter.
 */
router.get(
  '/filters',
  validate(productQuerySchema, 'query'),
  cacheResponse('products:filters', env.cache.filterTtl),
  listFilters,
)

router.get(
  '/suggest',
  validate(suggestQuerySchema, 'query'),
  cacheResponse('products:suggest', env.cache.suggestTtl),
  suggestProducts,
)

router.get(
  '/',
  validate(productQuerySchema, 'query'),
  cacheResponse('products:list', env.cache.productListTtl),
  listProducts,
)

router.get(
  '/:slug',
  validate(slugParamSchema, 'params'),
  cacheResponse('products:detail', env.cache.productDetailTtl),
  getProduct,
)

router.get(
  '/:slug/related',
  validate(slugParamSchema, 'params'),
  cacheResponse('products:related', env.cache.productDetailTtl),
  getRelated,
)

router.get('/:slug/reviews', validate(slugParamSchema, 'params'), listReviews)

router.post(
  '/:slug/reviews',
  requireAuth,
  validate(slugParamSchema, 'params'),
  validate(reviewBodySchema),
  createReview,
)

export default router
