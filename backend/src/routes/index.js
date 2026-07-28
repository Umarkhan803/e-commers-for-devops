import { Router } from 'express'
import { asyncHandler, sendSuccess } from '../utils/http.js'
import { mongoHealth } from '../config/mongo.js'
import { redisHealth } from '../config/redis.js'
import { env } from '../config/env.js'
import { requireAuth } from '../middleware/auth.js'
import { listCategories, listBrands } from '../controllers/product.controller.js'
import { cacheResponse } from '../middleware/cache.js'
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlist.controller.js'
import { PROMO_CODES } from '../services/pricing.service.js'
import productRoutes from './product.routes.js'
import authRoutes from './auth.routes.js'
import cartRoutes from './cart.routes.js'
import orderRoutes from './order.routes.js'

const router = Router()

/** GET /health — used by Docker health checks and the Nginx upstream probe. */
router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const [mongo, redis] = [mongoHealth(), await redisHealth()]
    const healthy = mongo.status === 'connected'

    res.status(healthy ? 200 : 503)
    res.json({
      success: healthy,
      data: {
        status: healthy ? 'ok' : 'degraded',
        uptimeSeconds: Math.round(process.uptime()),
        environment: env.nodeEnv,
        services: { mongo, redis },
      },
    })
  }),
)

/** GET / — a self-describing index of the API surface. */
router.get('/', (_req, res) => {
  sendSuccess(res, {
    name: 'Nova Commerce API',
    version: '1.0.0',
    endpoints: {
      'GET /health': 'Service and dependency health',
      'GET /products': 'Fetch all products with any combination of filters',
      'GET /products/filters': 'Every available filter option with live counts',
      'GET /products/suggest?q=': 'Type-ahead search suggestions',
      'GET /products/:slug': 'Product detail with related items and reviews',
      'GET /products/:slug/related': 'Related products',
      'GET /products/:slug/reviews': 'Reviews and rating distribution',
      'POST /products/:slug/reviews': 'Write a review (auth required)',
      'GET /categories': 'Categories with product counts',
      'GET /brands': 'Brands with product counts',
      'POST /auth/register | /auth/login | /auth/refresh | /auth/logout': 'Authentication',
      'GET /auth/me': 'Current account (auth required)',
      'GET|DELETE /cart': 'Read or empty the basket',
      'POST /cart/items': 'Add an item',
      'PATCH|DELETE /cart/items/:productId': 'Update quantity or remove',
      'POST /cart/promo': 'Apply a promo code',
      'PATCH /cart/shipping': 'Choose standard or express',
      'POST /orders': 'Place an order',
      'GET /orders': 'Order history (auth required)',
      'GET /orders/:reference': 'Single order',
      'GET|POST|DELETE /wishlist': 'Saved products (auth required)',
      'GET /promotions': 'Active promo codes',
    },
  })
})

router.get('/promotions', (_req, res) => {
  sendSuccess(
    res,
    Object.entries(PROMO_CODES).map(([code, promo]) => ({
      code,
      label: promo.label,
      type: promo.type,
      value: promo.value,
      minSubtotal: promo.minSubtotal,
    })),
  )
})

router.get('/categories', cacheResponse('categories', env.cache.filterTtl), listCategories)
router.get('/brands', cacheResponse('brands', env.cache.filterTtl), listBrands)

router.use('/products', productRoutes)
router.use('/auth', authRoutes)
router.use('/cart', cartRoutes)
router.use('/orders', orderRoutes)

router.get('/wishlist', requireAuth, getWishlist)
router.post('/wishlist/:slug', requireAuth, addToWishlist)
router.delete('/wishlist/:slug', requireAuth, removeFromWishlist)

export default router
