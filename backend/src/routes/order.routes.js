import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import { createOrderSchema, orderListQuerySchema } from '../validators/order.validators.js'
import { createOrder, listOrders, getOrder } from '../controllers/order.controller.js'

const router = Router()

// Guests can check out; only history requires an account.
router.post('/', optionalAuth, validate(createOrderSchema), createOrder)
router.get('/', requireAuth, validate(orderListQuerySchema, 'query'), listOrders)
router.get('/:reference', optionalAuth, getOrder)

export default router
