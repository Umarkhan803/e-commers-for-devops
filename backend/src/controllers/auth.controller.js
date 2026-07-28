import { asyncHandler, sendSuccess } from '../utils/http.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/User.js'
import { Cart } from '../models/Cart.js'
import {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  REFRESH_COOKIE,
  refreshCookieOptions,
} from '../services/token.service.js'

function authPayload(user, accessToken) {
  return { user: user.toJSON(), accessToken, tokenType: 'Bearer' }
}

/**
 * A guest may already have a basket keyed by session id. On sign-in that basket
 * is merged into the account's cart so nothing is lost at the checkout gate.
 */
async function adoptGuestCart(sessionId, user) {
  if (!sessionId) return
  const guestCart = await Cart.findOne({ sessionId, user: null })
  if (!guestCart || guestCart.items.length === 0) return

  const userCart = (await Cart.findOne({ user: user._id })) ?? new Cart({ user: user._id, items: [] })

  for (const item of guestCart.items) {
    const existing = userCart.findItem(item.product, item.color)
    if (existing) existing.quantity = Math.min(20, existing.quantity + item.quantity)
    else userCart.items.push(item)
  }

  await userCart.save()
  await guestCart.deleteOne()
}

/** POST /auth/register */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, newsletterOptIn } = req.body

  if (await User.exists({ email })) {
    throw ApiError.conflict('An account with that email already exists')
  }

  const user = await User.create({
    name,
    email,
    passwordHash: await User.hashPassword(password),
    newsletterOptIn,
    lastLoginAt: new Date(),
  })

  await adoptGuestCart(req.sessionId, user)

  const refreshToken = await issueRefreshToken(user)
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions)

  sendSuccess(res, authPayload(user, signAccessToken(user)), { status: 201 })
})

/** POST /auth/login */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email }).select('+passwordHash')
  // Same message for unknown email and wrong password: do not leak which.
  if (!user || !(await user.verifyPassword(password))) {
    throw ApiError.unauthorized('That email and password combination is not recognised')
  }

  user.lastLoginAt = new Date()
  await user.save()

  await adoptGuestCart(req.sessionId, user)

  const refreshToken = await issueRefreshToken(user)
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions)

  sendSuccess(res, authPayload(user, signAccessToken(user)))
})

/** POST /auth/refresh — rotates the refresh token and returns a new access token. */
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken
  if (!token) throw ApiError.unauthorized('No refresh token supplied')

  const payload = await rotateRefreshToken(token)
  const user = await User.findById(payload.sub)
  if (!user) throw ApiError.unauthorized('Account no longer exists')

  const refreshToken = await issueRefreshToken(user)
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions)

  sendSuccess(res, authPayload(user, signAccessToken(user)))
})

/** POST /auth/logout */
export const logout = asyncHandler(async (req, res) => {
  await revokeRefreshToken(req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken)
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions, maxAge: undefined })
  sendSuccess(res, { message: 'Signed out' })
})

/** GET /auth/me */
export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('wishlist', 'name slug price images brand rating')
  if (!user) throw ApiError.unauthorized('Account no longer exists')
  sendSuccess(res, user.toJSON())
})

/** POST /auth/addresses */
export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
  if (!user) throw ApiError.unauthorized('Account no longer exists')

  if (req.body.isDefault) {
    user.addresses.forEach((address) => {
      address.isDefault = false
    })
  }
  user.addresses.push(req.body)
  await user.save()

  sendSuccess(res, user.toJSON(), { status: 201 })
})
