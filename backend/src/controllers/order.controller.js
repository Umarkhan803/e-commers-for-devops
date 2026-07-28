import mongoose from 'mongoose'
import { asyncHandler, sendSuccess, buildPageMeta } from '../utils/http.js'
import { ApiError } from '../utils/ApiError.js'
import { Cart } from '../models/Cart.js'
import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { computeTotals } from '../services/pricing.service.js'
import { bumpCatalogueVersion } from '../services/cache.service.js'

function ownerFilter(req) {
  if (req.user) return { user: req.user.id }
  if (req.sessionId) return { sessionId: req.sessionId, user: null }
  throw ApiError.badRequest('An access token or X-Session-Id header is required')
}

/**
 * POST /orders
 *
 * Prices are recalculated from the database rather than trusted from the client,
 * stock is decremented, and the basket is emptied. Runs in a transaction when
 * the deployment supports one (replica set) and falls back to sequential writes
 * on a standalone mongod.
 */
export const createOrder = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne(ownerFilter(req)).populate('items.product')
  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest('Your cart is empty')
  }

  const lineItems = []
  for (const item of cart.items) {
    const product = item.product
    if (!product || !product.isActive) {
      throw ApiError.badRequest('An item in your cart is no longer available')
    }
    if (product.stock < item.quantity) {
      throw ApiError.badRequest(
        `Only ${product.stock} unit(s) of ${product.name} remain — please adjust your cart`,
      )
    }

    lineItems.push({
      product: product._id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: product.images?.[0]?.url ?? '',
      color: item.color,
      unitPrice: product.price,
      compareAtPrice: product.compareAtPrice ?? undefined,
      quantity: item.quantity,
      lineTotal: Math.round(product.price * item.quantity * 100) / 100,
    })
  }

  const shippingMethod = req.body.shippingMethod ?? cart.shippingMethod
  const promoCode = req.body.promoCode ?? cart.promoCode

  const totals = computeTotals(lineItems, { promoCode, shippingMethod })
  if (totals.promoError) throw ApiError.badRequest(totals.promoError)

  const estimatedDelivery = new Date()
  estimatedDelivery.setDate(estimatedDelivery.getDate() + (shippingMethod === 'express' ? 2 : 5))

  const orderDocument = {
    reference: Order.generateReference(),
    user: req.user?.id ?? null,
    email: req.body.shippingAddress.email,
    items: lineItems,
    shippingAddress: req.body.shippingAddress,
    billingAddress: req.body.billingSameAsShipping
      ? req.body.shippingAddress
      : req.body.billingAddress,
    paymentMethod: req.body.paymentMethod,
    paymentLast4: req.body.cardLast4 ?? null,
    // A real deployment would settle with a payment provider here.
    paymentStatus: req.body.paymentMethod === 'cod' ? 'pending' : 'paid',
    shippingMethod,
    promoCode: totals.promo?.code ?? null,
    totals: {
      subtotal: totals.subtotal,
      savings: totals.savings,
      discount: totals.discount,
      shipping: totals.shipping,
      tax: totals.tax,
      total: totals.total,
      currency: totals.currency,
    },
    status: 'confirmed',
    timeline: [
      { status: 'pending', note: 'Order received', at: new Date() },
      { status: 'confirmed', note: 'Payment authorised', at: new Date() },
    ],
    estimatedDelivery,
  }

  const stockWrites = lineItems.map((item) => ({
    updateOne: {
      filter: { _id: item.product, stock: { $gte: item.quantity } },
      update: { $inc: { stock: -item.quantity, salesCount: item.quantity } },
    },
  }))

  let order
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      const [created] = await Order.create([orderDocument], { session })
      const result = await Product.bulkWrite(stockWrites, { session })
      if (result.modifiedCount !== lineItems.length) {
        throw ApiError.conflict('Stock changed while placing the order — please try again')
      }
      cart.items = []
      cart.promoCode = null
      await cart.save({ session })
      order = created
    })
  } catch (error) {
    // Standalone mongod has no transaction support; retry without a session.
    const unsupported =
      error?.code === 20 ||
      /Transaction numbers are only allowed|replica set|Transactions are not supported/i.test(
        error?.message ?? '',
      )
    if (!unsupported) throw error

    order = await Order.create(orderDocument)
    await Product.bulkWrite(stockWrites)
    cart.items = []
    cart.promoCode = null
    await cart.save()
  } finally {
    await session.endSession()
  }

  // Stock changed, so cached catalogue pages are stale.
  await bumpCatalogueVersion()

  sendSuccess(res, order.toJSON(), { status: 201 })
})

/** GET /orders — the signed-in customer's order history. */
export const listOrders = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.validatedQuery
  const filter = { user: req.user.id }
  if (status) filter.status = status

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ])

  sendSuccess(res, orders.map((order) => order.toJSON()), {
    meta: buildPageMeta({ page, limit, total }),
  })
})

/**
 * GET /orders/:reference
 *
 * Readable by the owner, or by a guest who supplies the email the order was
 * placed with — the confirmation page needs to work before sign-up.
 */
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ reference: req.params.reference.toUpperCase() })
  if (!order) throw ApiError.notFound(`No order found with reference ${req.params.reference}`)

  const isOwner = req.user && order.user && order.user.toString() === req.user.id
  const emailMatches =
    req.query.email && order.email === String(req.query.email).trim().toLowerCase()

  if (!isOwner && !emailMatches) {
    throw ApiError.forbidden(
      'Sign in with the account that placed this order, or pass ?email= to confirm ownership',
    )
  }

  sendSuccess(res, order.toJSON())
})
