import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { optionalAuth } from '../middleware/auth.js'
import {
  addItemSchema,
  updateItemSchema,
  promoSchema,
  shippingSchema,
  productIdParamSchema,
} from '../validators/cart.validators.js'
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  applyPromo,
  setShipping,
} from '../controllers/cart.controller.js'

const router = Router()

// The cart serves guests as well as members, so authentication is optional here.
router.use(optionalAuth)

router.get('/', getCart)
router.delete('/', clearCart)
router.post('/items', validate(addItemSchema), addItem)
router.patch(
  '/items/:productId',
  validate(productIdParamSchema, 'params'),
  validate(updateItemSchema),
  updateItem,
)
router.delete('/items/:productId', validate(productIdParamSchema, 'params'), removeItem)
router.post('/promo', validate(promoSchema), applyPromo)
router.patch('/shipping', validate(shippingSchema), setShipping)

export default router
