import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { env } from '../config/env.js'
import { registerSchema, loginSchema, addressSchema } from '../validators/auth.validators.js'
import {
  register,
  login,
  refresh,
  logout,
  me,
  addAddress,
} from '../controllers/auth.controller.js'

const router = Router()

// Credential endpoints get a much tighter budget than the rest of the API.
const authLimiter = rateLimit({ bucket: 'auth', max: env.rateLimit.authMax, windowSeconds: 60 })

router.post('/register', authLimiter, validate(registerSchema), register)
router.post('/login', authLimiter, validate(loginSchema), login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', requireAuth, me)
router.post('/addresses', requireAuth, validate(addressSchema), addAddress)

export default router
