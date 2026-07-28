import { create } from 'zustand'
import * as account from '../api/account'
import { ApiError, assetUrl } from '../api/client'

/**
 * These mirror the API's shipping configuration. The server is authoritative for
 * what is actually charged — these values exist only so the radio buttons can
 * show a price before the choice is submitted.
 */
export const SHIPPING_METHODS = [
  {
    id: 'standard',
    label: 'Standard',
    detail: '4–6 business days',
    price: 9.99,
    freeOverThreshold: true,
  },
  { id: 'express', label: 'Express', detail: '2 business days', price: 24.99 },
]

export const TAX_RATE = 0.08
export const FREE_SHIPPING_THRESHOLD = 100

const EMPTY_TOTALS = {
  subtotal: 0,
  savings: 0,
  itemCount: 0,
  discount: 0,
  shipping: 0,
  tax: 0,
  total: 0,
  qualifiesForFreeShipping: false,
  amountToFreeShipping: FREE_SHIPPING_THRESHOLD,
}

/** Composite key: the same product in two colours is two separate lines. */
const lineIdFor = (productId, color) => `${productId}::${color ?? ''}`

/**
 * Adapts the API's cart payload to the shape the cart components consume. The
 * components were written against a nested `product` object, so one is rebuilt
 * from the flat line the server returns.
 */
export function adaptCart(payload) {
  if (!payload) return { items: [], totals: EMPTY_TOTALS, promo: null, warnings: [] }

  const rawItems = Array.isArray(payload.items) ? payload.items : []

  const items = rawItems.map((line) => {
    // Already-adapted lines (e.g. optimistic local updates) pass through.
    if (line?.product && line?.lineId) return line

    const productId = String(line.productId ?? line.product?.id ?? '')
    const color = line.color ?? null
    const quantity = Number(line.quantity) || 1
    const unitPrice = Number(line.unitPrice ?? line.product?.price) || 0
    const compareAtPrice = line.compareAtPrice ?? line.product?.compareAt ?? null
    const lineTotal =
      line.lineTotal != null
        ? Number(line.lineTotal)
        : Math.round(unitPrice * quantity * 100) / 100

    const lineSavings =
      compareAtPrice && compareAtPrice > unitPrice
        ? Math.round((compareAtPrice - unitPrice) * quantity * 100) / 100
        : 0

    const image = line.image ?? line.product?.image ?? null

    return {
      lineId: lineIdFor(productId, color),
      productId,
      quantity,
      color,
      lineTotal,
      lineSavings,
      product: {
        id: productId,
        slug: line.slug ?? line.product?.slug ?? '',
        name: line.name ?? line.product?.name ?? 'Product',
        brand: line.brand ?? line.product?.brand ?? '',
        category: line.category ?? line.product?.category ?? '',
        image: typeof image === 'string' ? assetUrl(image) : assetUrl(image?.url),
        price: unitPrice,
        compareAt: compareAtPrice,
        stock: line.stock ?? line.product?.stock ?? 0,
        inStock: line.inStock ?? (line.stock ?? line.product?.stock ?? 0) > 0,
        lowStock: (() => {
          const stock = line.stock ?? line.product?.stock ?? 0
          return stock > 0 && stock <= 12
        })(),
      },
    }
  })

  const totals = { ...EMPTY_TOTALS, ...(payload.totals ?? {}) }

  return {
    items,
    totals: {
      ...totals,
      qualifiesForFreeShipping: totals.shipping === 0 && totals.itemCount > 0,
      amountToFreeShipping:
        totals.amountToFreeShipping ??
        (totals.shipping === 0
          ? 0
          : Math.max(0, FREE_SHIPPING_THRESHOLD - (totals.subtotal ?? 0))),
    },
    promo: totals.promo ?? null,
    warnings: payload.warnings ?? [],
  }
}

function toResult(error) {
  return {
    ok: false,
    message:
      error instanceof ApiError
        ? error.message
        : 'Could not reach the server. Please try again.',
  }
}

export const useCartStore = create((set, get) => ({
  items: [],
  totals: EMPTY_TOTALS,
  promo: null,
  warnings: [],
  isDrawerOpen: false,
  shippingMethodId: 'standard',
  isSyncing: false,
  isLoading: true,

  applyPayload: (payload) => {
    const adapted = adaptCart(payload)
    set({
      items: adapted.items,
      totals: adapted.totals,
      promo: adapted.promo,
      warnings: adapted.warnings,
      ...(payload?.shippingMethod ? { shippingMethodId: payload.shippingMethod } : {}),
    })
  },

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),

  loadCart: async () => {
    set({ isLoading: true })
    try {
      const payload = await account.fetchCart()
      get().applyPayload(payload)
    } catch {
      /* an unreachable cart should not break the page */
    } finally {
      set({ isLoading: false })
    }
  },

  mutate: async (operation) => {
    set({ isSyncing: true })
    try {
      get().applyPayload(await operation())
      return { ok: true }
    } catch (error) {
      return toResult(error)
    } finally {
      set({ isSyncing: false })
    }
  },

  addItem: async (product, { quantity = 1, color = null, openDrawer = true } = {}) => {
    const result = await get().mutate(() =>
      account.addCartItem({
        slug: product.slug,
        quantity,
        color: color ?? product.colors?.[0] ?? undefined,
      }),
    )
    if (result.ok && openDrawer) set({ isDrawerOpen: true })
    return result
  },

  setQuantity: (lineId, quantity) => {
    const [productId, color] = lineId.split('::')
    return get().mutate(() =>
      account.updateCartItem(productId, {
        quantity,
        color: color === '' ? '' : color,
      }),
    )
  },

  removeItem: (lineId) => {
    const [productId] = lineId.split('::')
    return get().mutate(() => account.removeCartItem(productId))
  },

  clearCart: () => get().mutate(() => account.clearCart()),

  refresh: () => get().mutate(() => account.fetchCart()),

  applyPromo: async (rawCode) => {
    const code = rawCode.trim().toUpperCase()
    const result = await get().mutate(() => account.applyPromoCode(code))
    if (!result.ok) return result
    return { ok: true, message: `${code} applied.` }
  },

  removePromo: () => get().mutate(() => account.applyPromoCode(null)),

  chooseShippingMethod: (methodId) => {
    set({ shippingMethodId: methodId })
    return get().mutate(() => account.setShippingMethod(methodId))
  },

  quantityOf: (productId) =>
    get()
      .items.filter((item) => item.productId === productId || item.product?.id === productId)
      .reduce((sum, item) => sum + item.quantity, 0),
}))
