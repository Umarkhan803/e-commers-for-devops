import { api, setAccessToken } from './client'
import { normaliseProduct } from './products'

/* --------------------------------------------------------------------- auth */

async function authenticate(path, body) {
  const response = await api.post(path, body, { auth: false })
  setAccessToken(response.data.accessToken)
  return response.data.user
}

export const register = (payload) => authenticate('/auth/register', payload)
export const login = (payload) => authenticate('/auth/login', payload)

export async function logout() {
  try {
    await api.post('/auth/logout')
  } finally {
    // Clear locally even if the server call fails, so the UI cannot get stuck.
    setAccessToken(null)
  }
}

export async function fetchCurrentUser({ signal } = {}) {
  const response = await api.get('/auth/me', { signal })
  return response.data
}

/** Restores a session on page load using the httpOnly refresh cookie. */
export async function restoreSession() {
  const response = await api.post('/auth/refresh', undefined, { auth: false })
  setAccessToken(response.data.accessToken)
  return response.data.user
}

export async function addAddress(address) {
  const response = await api.post('/auth/addresses', address)
  return response.data
}

/* --------------------------------------------------------------------- cart */

export async function fetchCart({ signal } = {}) {
  const response = await api.get('/cart', { signal })
  return response.data
}

export async function addCartItem({ slug, quantity = 1, color }) {
  const response = await api.post('/cart/items', { slug, quantity, color })
  return response.data
}

export async function updateCartItem(productId, { quantity, color }) {
  const response = await api.patch(`/cart/items/${productId}`, { quantity, color })
  return response.data
}

export async function removeCartItem(productId) {
  const response = await api.delete(`/cart/items/${productId}`)
  return response.data
}

export async function clearCart() {
  const response = await api.delete('/cart')
  return response.data
}

export async function applyPromoCode(code) {
  const response = await api.post('/cart/promo', { code })
  return response.data
}

export async function setShippingMethod(shippingMethod) {
  const response = await api.patch('/cart/shipping', { shippingMethod })
  return response.data
}

/* ------------------------------------------------------------------- orders */

export async function placeOrder(payload) {
  const response = await api.post('/orders', payload)
  return response.data
}

export async function fetchOrder(reference, { email, signal } = {}) {
  const response = await api.get(`/orders/${encodeURIComponent(reference)}`, {
    params: email ? { email } : undefined,
    signal,
  })
  return response.data
}

export async function fetchOrders({ signal } = {}) {
  const response = await api.get('/orders', { signal })
  return { items: response.data, meta: response.meta }
}

/* ----------------------------------------------------------------- wishlist */

export async function fetchWishlist({ signal } = {}) {
  const response = await api.get('/wishlist', { signal })
  return response.data.map(normaliseProduct)
}

export async function addToWishlist(slug) {
  const response = await api.post(`/wishlist/${encodeURIComponent(slug)}`)
  return response.data.map(normaliseProduct)
}

export async function removeFromWishlist(slug) {
  const response = await api.delete(`/wishlist/${encodeURIComponent(slug)}`)
  return response.data.map(normaliseProduct)
}
