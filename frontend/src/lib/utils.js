/** Tiny className joiner — filters out falsy values so conditional classes stay readable. */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

export function formatPrice(value) {
  return currency.format(Number.isFinite(value) ? value : 0)
}

export function formatCompact(value) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  )
}

export function discountPercent(price, compareAt) {
  if (!compareAt || compareAt <= price) return 0
  return Math.round(((compareAt - price) / compareAt) * 100)
}

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable (private mode / quota) — state stays in memory */
  }
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
