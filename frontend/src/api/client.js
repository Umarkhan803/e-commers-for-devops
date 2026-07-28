import { readStorage, writeStorage } from '../lib/utils'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '')

const TOKEN_KEY = 'nova.token.v1'
const SESSION_KEY = 'nova.session.v1'

/** Thrown for any non-2xx response; carries the API's structured error detail. */
export class ApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details ?? null
  }

  /** Maps zod-style field errors into the shape the forms already render. */
  get fieldErrors() {
    if (!Array.isArray(this.details)) return {}
    return this.details.reduce((accumulator, entry) => {
      if (entry.field) accumulator[entry.field] = entry.message
      return accumulator
    }, {})
  }
}

/* --------------------------------------------------------------------- token */

let accessToken = readStorage(TOKEN_KEY, null)

export function setAccessToken(token) {
  accessToken = token
  writeStorage(TOKEN_KEY, token)
}

export const getAccessToken = () => accessToken

/**
 * A stable per-browser id so a guest's basket survives reloads. The server keys
 * anonymous carts on this; it is replaced by the account once signed in.
 */
function sessionId() {
  let existing = readStorage(SESSION_KEY, null)
  if (!existing) {
    existing =
      globalThis.crypto?.randomUUID?.() ??
      `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    writeStorage(SESSION_KEY, existing)
  }
  return existing
}

/* ------------------------------------------------------------------- request */

function buildQuery(params = {}) {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      if (value.length) search.set(key, value.join(','))
    } else if (typeof value === 'boolean') {
      if (value) search.set(key, 'true')
    } else {
      search.set(key, String(value))
    }
  }

  const query = search.toString()
  return query ? `?${query}` : ''
}

let refreshInFlight = null

/** Refreshes the access token, coalescing concurrent 401s into one call. */
async function refreshAccessToken() {
  refreshInFlight ??= fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-Session-Id': sessionId() },
  })
    .then(async (response) => {
      if (!response.ok) return null
      const payload = await response.json()
      const token = payload?.data?.accessToken ?? null
      if (token) setAccessToken(token)
      return token
    })
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null
    })

  return refreshInFlight
}

async function send(path, { method = 'GET', body, params, signal, auth = true } = {}) {
  const url = `${BASE_URL}${path}${buildQuery(params)}`

  const perform = (token) =>
    fetch(url, {
      method,
      signal,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-Session-Id': sessionId(),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })

  let response = await perform(accessToken)

  // A stale access token is the common case; retry once behind a refresh.
  if (response.status === 401 && auth && accessToken) {
    const token = await refreshAccessToken()
    if (token) response = await perform(token)
  }

  if (response.status === 204) return null

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok || payload?.success === false) {
    throw new ApiError(payload?.error?.message ?? `Request failed (${response.status})`, {
      status: response.status,
      details: payload?.error?.details,
    })
  }

  return payload
}

export const api = {
  get: (path, options) => send(path, { ...options, method: 'GET' }),
  post: (path, body, options) => send(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => send(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => send(path, { ...options, method: 'DELETE' }),
}

/** Product imagery is served by the API, which may live on another origin. */
export function assetUrl(relativePath) {
  if (!relativePath) return ''
  if (/^(https?:|data:)/.test(relativePath)) return relativePath
  return `${BASE_URL.replace(/\/api\/v\d+$/, '')}${relativePath}`
}

export { BASE_URL }
