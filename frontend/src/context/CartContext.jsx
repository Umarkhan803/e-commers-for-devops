import { useEffect } from 'react'
import { useAuth } from './AuthContext'
import {
  SHIPPING_METHODS,
  TAX_RATE,
  FREE_SHIPPING_THRESHOLD,
  useCartStore,
} from '../stores/cartStore'

export { SHIPPING_METHODS, TAX_RATE, FREE_SHIPPING_THRESHOLD }

/**
 * Keeps the Zustand cart in sync with auth. Guest → signed-in merges happen
 * server-side, so we re-fetch whenever the session changes.
 */
export function CartProvider({ children }) {
  const { isAuthenticated, isRestoring } = useAuth()
  const loadCart = useCartStore((state) => state.loadCart)

  useEffect(() => {
    if (isRestoring) return
    loadCart()
  }, [isAuthenticated, isRestoring, loadCart])

  return children
}

/** Compatibility hook — same shape as the previous Context API. */
export function useCart() {
  const items = useCartStore((s) => s.items)
  const totals = useCartStore((s) => s.totals)
  const promo = useCartStore((s) => s.promo)
  const warnings = useCartStore((s) => s.warnings)
  const isLoading = useCartStore((s) => s.isLoading)
  const isSyncing = useCartStore((s) => s.isSyncing)
  const isDrawerOpen = useCartStore((s) => s.isDrawerOpen)
  const shippingMethodId = useCartStore((s) => s.shippingMethodId)

  const openDrawer = useCartStore((s) => s.openDrawer)
  const closeDrawer = useCartStore((s) => s.closeDrawer)
  const addItem = useCartStore((s) => s.addItem)
  const setQuantity = useCartStore((s) => s.setQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const refresh = useCartStore((s) => s.refresh)
  const applyPromo = useCartStore((s) => s.applyPromo)
  const removePromo = useCartStore((s) => s.removePromo)
  const chooseShippingMethod = useCartStore((s) => s.chooseShippingMethod)
  const quantityOf = useCartStore((s) => s.quantityOf)

  const shippingMethod =
    SHIPPING_METHODS.find((method) => method.id === shippingMethodId) ?? SHIPPING_METHODS[0]

  return {
    items,
    totals,
    promo,
    warnings,
    isLoading,
    isSyncing,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    shippingMethod,
    shippingMethodId,
    setShippingMethodId: chooseShippingMethod,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
    refresh,
    applyPromo,
    removePromo,
    quantityOf,
  }
}
