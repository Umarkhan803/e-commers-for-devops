import { asyncHandler, sendSuccess } from '../utils/http.js'
import { ApiError } from '../utils/ApiError.js'
import { Cart } from '../models/Cart.js'
import { Product } from '../models/Product.js'
import { computeTotals } from '../services/pricing.service.js'

/** Signed-in shoppers key off the user id, guests off the session header. */
function ownerFilter(req) {
  if (req.user) return { user: req.user.id }
  if (req.sessionId) return { sessionId: req.sessionId, user: null }
  throw ApiError.badRequest(
    'A cart needs either an access token or an X-Session-Id header to identify it',
  )
}

async function loadCart(req, { create = false } = {}) {
  const filter = ownerFilter(req)
  let cart = await Cart.findOne(filter)
  if (!cart && create) cart = new Cart(filter)
  return cart
}

/** Re-reads current product state so stale snapshots surface as warnings. */
async function serialiseCart(cart) {
  if (!cart || cart.items.length === 0) {
    return {
      items: [],
      promoCode: cart?.promoCode ?? null,
      shippingMethod: cart?.shippingMethod ?? 'standard',
      totals: computeTotals([], { promoCode: cart?.promoCode, shippingMethod: cart?.shippingMethod }),
      warnings: [],
    }
  }

  await cart.populate('items.product')

  const warnings = []
  const items = []

  for (const item of cart.items) {
    const product = item.product
    if (!product || !product.isActive) {
      warnings.push('An item was removed because it is no longer available')
      continue
    }

    if (product.price !== item.unitPrice) {
      warnings.push(`The price of ${product.name} changed to $${product.price.toFixed(2)}`)
      item.unitPrice = product.price
      item.compareAtPrice = product.compareAtPrice
    }

    const quantity = Math.min(item.quantity, Math.max(1, product.stock))
    if (product.stock === 0) {
      warnings.push(`${product.name} is out of stock`)
    } else if (quantity !== item.quantity) {
      warnings.push(`Only ${product.stock} of ${product.name} left, quantity reduced`)
      item.quantity = quantity
    }

    items.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      category: product.category,
      image: product.images?.[0]?.url ?? null,
      color: item.color,
      unitPrice: item.unitPrice,
      compareAtPrice: item.compareAtPrice ?? null,
      quantity: item.quantity,
      lineTotal: Math.round(item.unitPrice * item.quantity * 100) / 100,
      stock: product.stock,
      inStock: product.stock > 0,
    })
  }

  return {
    items,
    promoCode: cart.promoCode,
    shippingMethod: cart.shippingMethod,
    totals: computeTotals(items, {
      promoCode: cart.promoCode,
      shippingMethod: cart.shippingMethod,
    }),
    warnings,
  }
}

/** GET /cart */
export const getCart = asyncHandler(async (req, res) => {
  const cart = await loadCart(req)
  sendSuccess(res, await serialiseCart(cart))
})

/** POST /cart/items */
export const addItem = asyncHandler(async (req, res) => {
  const { productId, slug, quantity, color } = req.body

  const product = await Product.findOne(
    productId ? { _id: productId, isActive: true } : { slug, isActive: true },
  )
  if (!product) throw ApiError.notFound('That product does not exist')
  if (product.stock === 0) throw ApiError.badRequest(`${product.name} is currently out of stock`)

  const cart = await loadCart(req, { create: true })

  // Resolve the colour before lookup so an unspecified colour merges into the
  // default variant's line rather than matching an arbitrary one.
  const resolvedColor = color ?? product.colors?.[0] ?? ''
  const existing = cart.findItem(product._id, resolvedColor)

  const desired = (existing?.quantity ?? 0) + quantity
  if (desired > product.stock) {
    throw ApiError.badRequest(
      `Only ${product.stock} unit(s) of ${product.name} are available`,
    )
  }

  if (existing) {
    existing.quantity = Math.min(20, desired)
    existing.unitPrice = product.price
    existing.compareAtPrice = product.compareAtPrice
  } else {
    cart.items.push({
      product: product._id,
      quantity,
      color: resolvedColor,
      unitPrice: product.price,
      compareAtPrice: product.compareAtPrice,
    })
  }

  await cart.save()
  sendSuccess(res, await serialiseCart(cart), { status: 201 })
})

/** PATCH /cart/items/:productId */
export const updateItem = asyncHandler(async (req, res) => {
  const cart = await loadCart(req)
  if (!cart) throw ApiError.notFound('Your cart is empty')

  const item = cart.findItem(req.params.productId, req.body.color)
  if (!item) throw ApiError.notFound('That item is not in your cart')

  if (req.body.quantity === 0) {
    cart.items.pull(item)
  } else {
    const product = await Product.findById(req.params.productId)
    if (product && req.body.quantity > product.stock) {
      throw ApiError.badRequest(`Only ${product.stock} unit(s) available`)
    }
    item.quantity = req.body.quantity
  }

  await cart.save()
  sendSuccess(res, await serialiseCart(cart))
})

/** DELETE /cart/items/:productId */
export const removeItem = asyncHandler(async (req, res) => {
  const cart = await loadCart(req)
  if (!cart) throw ApiError.notFound('Your cart is empty')

  const before = cart.items.length
  cart.items = cart.items.filter(
    (item) => item.product.toString() !== req.params.productId,
  )
  if (cart.items.length === before) throw ApiError.notFound('That item is not in your cart')

  await cart.save()
  sendSuccess(res, await serialiseCart(cart))
})

/** DELETE /cart */
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await loadCart(req)
  if (cart) {
    cart.items = []
    cart.promoCode = null
    await cart.save()
  }
  sendSuccess(res, await serialiseCart(cart))
})

/** POST /cart/promo — validates server-side and reports why a code was refused. */
export const applyPromo = asyncHandler(async (req, res) => {
  const cart = await loadCart(req, { create: true })
  cart.promoCode = req.body.code ? req.body.code.trim().toUpperCase() : null
  await cart.save()

  const payload = await serialiseCart(cart)
  if (payload.totals.promoError) {
    // Do not persist a code that cannot apply.
    cart.promoCode = null
    await cart.save()
    throw ApiError.badRequest(payload.totals.promoError)
  }

  sendSuccess(res, payload)
})

/** PATCH /cart/shipping */
export const setShipping = asyncHandler(async (req, res) => {
  const cart = await loadCart(req, { create: true })
  cart.shippingMethod = req.body.shippingMethod
  await cart.save()
  sendSuccess(res, await serialiseCart(cart))
})

export { serialiseCart }
