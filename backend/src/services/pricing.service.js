import { env } from '../config/env.js'

/** Promotions are defined server-side so a client cannot invent a discount. */
export const PROMO_CODES = {
  NOVA10: { type: 'percent', value: 10, label: '10% off your order', minSubtotal: 0 },
  WELCOME15: { type: 'percent', value: 15, label: '15% off your first order', minSubtotal: 150 },
  FREESHIP: { type: 'shipping', value: 100, label: 'Free shipping', minSubtotal: 0 },
  SAVE25: { type: 'fixed', value: 25, label: '$25 off orders over $250', minSubtotal: 250 },
}

const round = (value) => Math.round(value * 100) / 100

export function resolvePromo(code, subtotal) {
  if (!code) return { promo: null, error: null }

  const normalised = code.trim().toUpperCase()
  const promo = PROMO_CODES[normalised]
  if (!promo) return { promo: null, error: `"${normalised}" is not a valid promo code` }

  if (subtotal < promo.minSubtotal) {
    return {
      promo: null,
      error: `${normalised} requires a subtotal of at least $${promo.minSubtotal.toFixed(2)}`,
    }
  }

  return { promo: { code: normalised, ...promo }, error: null }
}

/**
 * Single source of truth for basket arithmetic, shared by the cart and the
 * order endpoints so a quote can never disagree with what is charged.
 *
 * Tax is applied after discounts and excludes shipping.
 */
export function computeTotals(items, { promoCode = null, shippingMethod = 'standard' } = {}) {
  const subtotal = round(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0))

  const savings = round(
    items.reduce((sum, item) => {
      if (!item.compareAtPrice || item.compareAtPrice <= item.unitPrice) return sum
      return sum + (item.compareAtPrice - item.unitPrice) * item.quantity
    }, 0),
  )

  const { promo, error: promoError } = resolvePromo(promoCode, subtotal)

  let discount = 0
  if (promo?.type === 'percent') discount = round((subtotal * promo.value) / 100)
  if (promo?.type === 'fixed') discount = round(Math.min(promo.value, subtotal))

  const discountedSubtotal = round(Math.max(0, subtotal - discount))

  const baseShipping =
    shippingMethod === 'express' ? env.shipping.expressFee : env.shipping.standardFee
  let shipping =
    items.length === 0 || discountedSubtotal >= env.shipping.freeThreshold ? 0 : baseShipping
  if (promo?.type === 'shipping') shipping = 0

  const tax = round(discountedSubtotal * env.tax.rate)
  const total = round(discountedSubtotal + shipping + tax)

  return {
    subtotal,
    savings,
    discount,
    shipping: round(shipping),
    tax,
    total,
    currency: 'USD',
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    promo: promo ? { code: promo.code, label: promo.label, type: promo.type } : null,
    promoError,
    freeShippingThreshold: env.shipping.freeThreshold,
    amountToFreeShipping:
      shipping === 0 ? 0 : round(Math.max(0, env.shipping.freeThreshold - discountedSubtotal)),
    taxRate: env.tax.rate,
  }
}
