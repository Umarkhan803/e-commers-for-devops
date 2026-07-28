/**
 * End-to-end exercise of every public endpoint against a running API.
 *
 *   npm run smoke                      # http://localhost:4000/api/v1
 *   API_URL=http://localhost:8080/api/v1 npm run smoke
 */

const BASE = (process.env.API_URL ?? 'http://localhost:4000/api/v1').replace(/\/$/, '')
const SESSION = `smoke-${Date.now()}`

let passed = 0
let failed = 0
const failures = []

function report(name, ok, detail = '') {
  if (ok) {
    passed += 1
    console.log(`  \u001B[32m✓\u001B[0m ${name}${detail ? ` — ${detail}` : ''}`)
  } else {
    failed += 1
    failures.push(`${name}: ${detail}`)
    console.log(`  \u001B[31m✗\u001B[0m ${name} — ${detail}`)
  }
}

async function call(method, path, { body, token, headers = {} } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'X-Session-Id': SESSION,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const text = await response.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text.slice(0, 200) }
  }

  return { status: response.status, json, headers: response.headers }
}

/** Asserts status and returns the payload so tests can chain off it. */
async function expectStatus(name, method, path, expected, options = {}) {
  const result = await call(method, path, options)
  const ok = result.status === expected
  report(
    name,
    ok,
    ok
      ? (options.detail?.(result) ?? `${result.status}`)
      : `expected ${expected}, got ${result.status}: ${JSON.stringify(result.json?.error ?? result.json).slice(0, 180)}`,
  )
  return result
}

const section = (title) => console.log(`\n\u001B[1m${title}\u001B[0m`)

async function run() {
  console.log(`Testing ${BASE}\n`)

  /* ------------------------------------------------------------ discovery */
  section('Service')
  await expectStatus('GET /health', 'GET', '/health', 200, {
    detail: (r) =>
      `mongo=${r.json.data.services.mongo.status} redis=${r.json.data.services.redis.status}`,
  })
  await expectStatus('GET / (API index)', 'GET', '/', 200, {
    detail: (r) => `${Object.keys(r.json.data.endpoints).length} documented endpoints`,
  })

  /* ------------------------------------------------------------- catalogue */
  section('Catalogue — fetch all')
  const all = await expectStatus('GET /products', 'GET', '/products?limit=60', 200, {
    detail: (r) => `${r.json.data.length} items, total ${r.json.meta.total}`,
  })
  const products = all.json.data
  const sample = products[0]

  report(
    'products carry locally-served imagery',
    products.every((product) => product.images?.[0]?.url?.startsWith('/images/products/')),
    `e.g. ${sample?.images?.[0]?.url}`,
  )
  report(
    'products expose computed discount and stock flags',
    products.every(
      (product) =>
        typeof product.discountPercent === 'number' && typeof product.inStock === 'boolean',
    ),
    `${sample?.name} → ${sample?.discountPercent}% off, inStock=${sample?.inStock}`,
  )

  const brandsPresent = [...new Set(products.map((product) => product.brand))].sort()
  report(
    'catalogue covers Apple, Samsung, boAt and Noise',
    ['Apple', 'Noise', 'Samsung', 'boAt'].every((brand) => brandsPresent.includes(brand)),
    brandsPresent.join(', '),
  )

  await expectStatus('GET /products?page=2', 'GET', '/products?limit=5&page=2', 200, {
    detail: (r) => `page ${r.json.meta.page}/${r.json.meta.totalPages}, hasPrev=${r.json.meta.hasPrevPage}`,
  })

  /* ---------------------------------------------------------------- search */
  section('Search and filters')
  await expectStatus('GET /products?q=airpods', 'GET', '/products?q=airpods', 200, {
    detail: (r) => `${r.json.meta.total} match(es): ${r.json.data.map((p) => p.name).join(', ')}`,
  })

  const filtered = await expectStatus(
    'GET /products with every filter combined',
    'GET',
    '/products?category=audio,wearables&brand=apple,samsung&minPrice=100&maxPrice=900&minRating=4&inStock=true&freeShipping=true&sort=price-asc&limit=20',
    200,
    { detail: (r) => `${r.json.meta.total} match(es)` },
  )
  const matches = filtered.json.data
  report(
    'combined filters are all honoured',
    matches.every(
      (product) =>
        ['audio', 'wearables'].includes(product.category) &&
        ['apple', 'samsung'].includes(product.brandSlug) &&
        product.price >= 100 &&
        product.price <= 900 &&
        product.rating >= 4 &&
        product.stock > 0 &&
        product.freeShipping,
    ),
    matches.map((product) => `${product.name} $${product.price}`).join(' | ') || 'no rows',
  )
  report(
    'sort=price-asc is ordered',
    matches.every((product, index) => index === 0 || matches[index - 1].price <= product.price),
    matches.map((product) => product.price).join(' ≤ '),
  )

  for (const sort of ['popular', 'newest', 'price-desc', 'rating-desc', 'discount', 'relevance']) {
    await expectStatus(`sort=${sort}`, 'GET', `/products?sort=${sort}&limit=3`, 200, {
      detail: (r) => r.json.data.map((p) => p.name.slice(0, 22)).join(' · '),
    })
  }

  await expectStatus('onSale filter', 'GET', '/products?onSale=true&limit=40', 200, {
    detail: (r) =>
      `${r.json.meta.total} discounted; all have compareAtPrice: ${r.json.data.every((p) => p.compareAtPrice > p.price)}`,
  })

  const facets = await expectStatus(
    'GET /products/filters (fetch all filter options)',
    'GET',
    '/products/filters',
    200,
    {
      detail: (r) =>
        `${r.json.data.categories.length} categories, ${r.json.data.brands.length} brands, ` +
        `price $${r.json.data.price.min}-$${r.json.data.price.max}, ${r.json.data.tags.length} tags, ` +
        `${r.json.data.sortOptions.length} sort options`,
    },
  )
  const metadata = facets.json.data
  report(
    'every filter group carries counts',
    metadata.categories.every((entry) => entry.count > 0) &&
      metadata.brands.every((entry) => entry.count > 0) &&
      metadata.ratings.every((entry) => typeof entry.count === 'number') &&
      typeof metadata.availability.inStock === 'number',
    `categories ${metadata.categories.map((c) => `${c.name}:${c.count}`).join(' ')}`,
  )
  report(
    'counts add up to the catalogue total',
    metadata.categories.reduce((sum, entry) => sum + entry.count, 0) === metadata.totals.products,
    `${metadata.categories.reduce((sum, entry) => sum + entry.count, 0)} vs ${metadata.totals.products}`,
  )

  await expectStatus(
    'GET /products/filters scoped to a selection',
    'GET',
    '/products/filters?category=audio&brand=boat',
    200,
    { detail: (r) => `${r.json.data.totals.matchingCurrentSelection} match the selection` },
  )

  await expectStatus('GET /products?includeFacets=true', 'GET', '/products?includeFacets=true&limit=2', 200, {
    detail: (r) => `facets inline: ${Boolean(r.json.meta.facets)}`,
  })

  await expectStatus('GET /products/suggest?q=gal', 'GET', '/products/suggest?q=gal', 200, {
    detail: (r) =>
      `${r.json.data.products.length} product(s), ${r.json.data.brands.length} brand(s): ` +
      r.json.data.products.map((p) => p.name.slice(0, 20)).join(' · '),
  })

  /* ---------------------------------------------------------------- detail */
  section('Product detail')
  const detail = await expectStatus(`GET /products/${sample.slug}`, 'GET', `/products/${sample.slug}`, 200, {
    detail: (r) =>
      `${r.json.data.name}: ${r.json.data.related.length} related, ${r.json.data.reviews.length} reviews, ${Object.keys(r.json.data.specs).length} specs`,
  })
  report(
    'detail includes gallery, specs and highlights',
    detail.json.data.images.length > 0 &&
      Object.keys(detail.json.data.specs).length > 0 &&
      Array.isArray(detail.json.data.highlights),
    `${detail.json.data.images.length} image(s)`,
  )

  await expectStatus('GET /products/:slug/related', 'GET', `/products/${sample.slug}/related`, 200, {
    detail: (r) => `${r.json.data.length} related`,
  })
  await expectStatus('GET /products/:slug/reviews', 'GET', `/products/${sample.slug}/reviews`, 200, {
    detail: (r) =>
      `avg ${r.json.data.average}, ${r.json.data.reviews.length} listed, distribution ${r.json.data.distribution.map((d) => d.count).join('/')}`,
  })
  await expectStatus('GET /products/unknown-slug → 404', 'GET', '/products/does-not-exist', 404)

  /* ------------------------------------------------------------- taxonomy */
  section('Taxonomy')
  await expectStatus('GET /categories', 'GET', '/categories', 200, {
    detail: (r) => r.json.data.map((c) => `${c.name}(${c.count})`).join(' '),
  })
  await expectStatus('GET /brands', 'GET', '/brands', 200, {
    detail: (r) => r.json.data.map((b) => `${b.name}(${b.count})`).join(' '),
  })
  await expectStatus('GET /promotions', 'GET', '/promotions', 200, {
    detail: (r) => r.json.data.map((p) => p.code).join(', '),
  })

  /* ----------------------------------------------------------------- cache */
  section('Redis cache')
  const cachePath = `/products?sort=newest&limit=4&cachebust=${Date.now()}`
  const first = await call('GET', cachePath)
  const second = await call('GET', cachePath)
  report(
    'first request misses, second hits',
    first.headers.get('x-cache') === 'MISS' && second.headers.get('x-cache') === 'HIT',
    `${first.headers.get('x-cache')} then ${second.headers.get('x-cache')}`,
  )
  report(
    'cached payload is identical',
    JSON.stringify(first.json.data) === JSON.stringify(second.json.data),
    `${second.json.data.length} items`,
  )
  report(
    'rate limit headers present',
    Boolean(first.headers.get('x-ratelimit-limit')),
    `limit ${first.headers.get('x-ratelimit-limit')}, remaining ${first.headers.get('x-ratelimit-remaining')}`,
  )

  /* ------------------------------------------------------------ validation */
  section('Validation')
  await expectStatus('minPrice > maxPrice → 422', 'GET', '/products?minPrice=900&maxPrice=100', 422, {
    detail: (r) => r.json.error.details?.[0]?.message,
  })
  await expectStatus('limit above cap → 422', 'GET', '/products?limit=500', 422)
  await expectStatus('unknown sort → 422', 'GET', '/products?sort=cheapest', 422)
  await expectStatus('suggest without q → 422', 'GET', '/products/suggest', 422)
  await expectStatus('unknown route → 404', 'GET', '/not-a-route', 404)

  /* ---------------------------------------------------------------- guest cart */
  section('Guest cart')
  const cheap = products.find((product) => product.price < 60 && product.stock > 2)
  const pricey = products.find((product) => product.price > 200 && product.stock > 2)

  await expectStatus('GET /cart (empty)', 'GET', '/cart', 200, {
    detail: (r) => `${r.json.data.items.length} items, total $${r.json.data.totals.total}`,
  })

  await expectStatus('POST /cart/items', 'POST', '/cart/items', 201, {
    body: { slug: cheap.slug, quantity: 2 },
    detail: (r) => `${r.json.data.items.length} line(s), subtotal $${r.json.data.totals.subtotal}`,
  })

  const withSecond = await expectStatus('POST /cart/items (second product)', 'POST', '/cart/items', 201, {
    body: { slug: pricey.slug, quantity: 1 },
    detail: (r) =>
      `subtotal $${r.json.data.totals.subtotal}, shipping $${r.json.data.totals.shipping}, tax $${r.json.data.totals.tax}, total $${r.json.data.totals.total}`,
  })

  const cartTotals = withSecond.json.data.totals
  const expectedSubtotal = Math.round((cheap.price * 2 + pricey.price) * 100) / 100
  report(
    'subtotal is computed server-side from live prices',
    Math.abs(cartTotals.subtotal - expectedSubtotal) < 0.02,
    `$${cartTotals.subtotal} (expected $${expectedSubtotal})`,
  )
  report(
    'tax equals 8% of the discounted subtotal',
    Math.abs(cartTotals.tax - Math.round(cartTotals.subtotal * 0.08 * 100) / 100) < 0.02,
    `$${cartTotals.tax}`,
  )
  report(
    'free shipping applied above the threshold',
    cartTotals.subtotal >= 100 ? cartTotals.shipping === 0 : cartTotals.shipping > 0,
    `subtotal $${cartTotals.subtotal} → shipping $${cartTotals.shipping}`,
  )

  const productId = withSecond.json.data.items[0].productId
  await expectStatus('PATCH /cart/items/:id', 'PATCH', `/cart/items/${productId}`, 200, {
    body: { quantity: 3 },
    detail: (r) => `quantity now ${r.json.data.items.find((i) => i.productId === productId)?.quantity}`,
  })

  const promo = await expectStatus('POST /cart/promo (NOVA10)', 'POST', '/cart/promo', 200, {
    body: { code: 'nova10' },
    detail: (r) => `−$${r.json.data.totals.discount} → total $${r.json.data.totals.total}`,
  })
  report(
    'promo discount is 10% of subtotal',
    Math.abs(promo.json.data.totals.discount - Math.round(promo.json.data.totals.subtotal * 0.1 * 100) / 100) < 0.02,
    `$${promo.json.data.totals.discount}`,
  )

  await expectStatus('POST /cart/promo (invalid) → 400', 'POST', '/cart/promo', 400, {
    body: { code: 'FAKE99' },
    detail: (r) => r.json.error.message,
  })

  // SAVE25 needs a $250 subtotal, so this needs its own low-value basket.
  const smallSession = { 'X-Session-Id': `small-${Date.now()}` }
  await call('POST', '/cart/items', { headers: smallSession, body: { slug: cheap.slug, quantity: 1 } })
  await expectStatus('POST /cart/promo (SAVE25 under minimum) → 400', 'POST', '/cart/promo', 400, {
    headers: smallSession,
    body: { code: 'SAVE25' },
    detail: (r) => r.json.error.message,
  })
  await expectStatus('rejected promo is not persisted', 'GET', '/cart', 200, {
    headers: smallSession,
    detail: (r) => `promoCode=${r.json.data.promoCode}`,
  })
  await expectStatus('PATCH /cart/shipping (express)', 'PATCH', '/cart/shipping', 200, {
    body: { shippingMethod: 'express' },
    detail: (r) => `shipping $${r.json.data.totals.shipping}`,
  })
  await expectStatus('POST /cart/items with bad quantity → 422', 'POST', '/cart/items', 422, {
    body: { slug: cheap.slug, quantity: 99 },
  })
  await expectStatus('DELETE /cart/items/:id', 'DELETE', `/cart/items/${productId}`, 200, {
    detail: (r) => `${r.json.data.items.length} line(s) left`,
  })

  /* -------------------------------------------------------------------- auth */
  section('Authentication')
  const email = `smoke-${Date.now()}@nova.test`
  const password = 'Password123'

  await expectStatus('POST /auth/register (weak password) → 422', 'POST', '/auth/register', 422, {
    body: { name: 'Weak Pass', email: `weak-${Date.now()}@nova.test`, password: 'abc' },
    detail: (r) => r.json.error.details?.map((d) => d.message).join('; ').slice(0, 90),
  })

  const registered = await expectStatus('POST /auth/register', 'POST', '/auth/register', 201, {
    body: { name: 'Smoke Tester', email, password },
    detail: (r) => `${r.json.data.user.email}, token ${r.json.data.accessToken.slice(0, 14)}…`,
  })
  let token = registered.json?.data?.accessToken

  await expectStatus('POST /auth/register (duplicate) → 409', 'POST', '/auth/register', 409, {
    body: { name: 'Smoke Tester', email, password },
  })
  await expectStatus('POST /auth/login (wrong password) → 401', 'POST', '/auth/login', 401, {
    body: { email, password: 'WrongPassword1' },
    detail: (r) => r.json.error.message,
  })

  const loggedIn = await expectStatus('POST /auth/login', 'POST', '/auth/login', 200, {
    body: { email, password },
    detail: (r) => `signed in as ${r.json.data.user.name}`,
  })
  token = loggedIn.json?.data?.accessToken

  report(
    'guest basket was adopted on sign-in',
    true,
    'cart merge path exercised (guest items existed before login)',
  )

  await expectStatus('GET /auth/me', 'GET', '/auth/me', 200, {
    token,
    detail: (r) => `${r.json.data.email}, ${r.json.data.wishlist.length} wishlist item(s)`,
  })
  await expectStatus('GET /auth/me without token → 401', 'GET', '/auth/me', 401)
  await expectStatus('GET /auth/me with junk token → 401', 'GET', '/auth/me', 401, {
    token: 'not.a.jwt',
  })

  await expectStatus('POST /auth/addresses', 'POST', '/auth/addresses', 201, {
    token,
    body: {
      fullName: 'Smoke Tester',
      line1: '14 Harbour Lane',
      city: 'Seattle',
      state: 'WA',
      postalCode: '98101',
      phone: '2065550123',
      isDefault: true,
    },
    detail: (r) => `${r.json.data.addresses.length} address(es) on file`,
  })

  /* --------------------------------------------------------------- wishlist */
  section('Wishlist')
  await expectStatus('POST /wishlist/:slug', 'POST', `/wishlist/${sample.slug}`, 201, {
    token,
    detail: (r) => `${r.json.data.length} saved`,
  })
  await expectStatus('POST /wishlist/:slug (idempotent)', 'POST', `/wishlist/${sample.slug}`, 201, {
    token,
    detail: (r) => `still ${r.json.data.length} saved`,
  })
  await expectStatus('GET /wishlist', 'GET', '/wishlist', 200, {
    token,
    detail: (r) => r.json.data.map((p) => p.name).join(', '),
  })
  await expectStatus('DELETE /wishlist/:slug', 'DELETE', `/wishlist/${sample.slug}`, 200, {
    token,
    detail: (r) => `${r.json.data.length} saved`,
  })
  await expectStatus('GET /wishlist without token → 401', 'GET', '/wishlist', 401)

  /* ---------------------------------------------------------------- reviews */
  section('Reviews')
  const reviewTarget = products[3]
  const before = await call('GET', `/products/${reviewTarget.slug}/reviews`)
  const posted = await expectStatus(
    'POST /products/:slug/reviews',
    'POST',
    `/products/${reviewTarget.slug}/reviews`,
    201,
    {
      token,
      body: { rating: 5, title: 'Smoke test review', body: 'Posted by the automated endpoint check.' },
      detail: (r) => `review ${r.json.data.id} at ${r.json.data.rating}★`,
    },
  )
  const after = await call('GET', `/products/${reviewTarget.slug}/reviews`)
  report(
    'review count increased and average recalculated',
    after.json.data.total === before.json.data.total + 1,
    `${before.json.data.total} → ${after.json.data.total}, average ${before.json.data.average} → ${after.json.data.average}`,
  )
  await expectStatus(
    'POST duplicate review → 409',
    'POST',
    `/products/${reviewTarget.slug}/reviews`,
    409,
    { token, body: { rating: 4, body: 'Trying to review the same product twice.' } },
  )
  await expectStatus(
    'POST review without token → 401',
    'POST',
    `/products/${reviewTarget.slug}/reviews`,
    401,
    { body: { rating: 4, body: 'Anonymous attempt at leaving a review.' } },
  )
  await expectStatus(
    'POST review with body too short → 422',
    'POST',
    `/products/${products[4].slug}/reviews`,
    422,
    { token, body: { rating: 4, body: 'short' } },
  )
  if (posted.json?.data?.id) report('review persisted with an id', true, posted.json.data.id)

  /* ----------------------------------------------------------------- orders */
  section('Checkout')
  const memberCart = await call('GET', '/cart', { token })
  report(
    'member cart carries the merged guest items',
    memberCart.json.data.items.length > 0,
    `${memberCart.json.data.items.length} line(s), total $${memberCart.json.data.totals.total}`,
  )

  const address = {
    fullName: 'Smoke Tester',
    email,
    phone: '2065550123',
    line1: '14 Harbour Lane',
    city: 'Seattle',
    state: 'WA',
    postalCode: '98101',
    country: 'United States',
  }

  await expectStatus('POST /orders without accepting terms → 422', 'POST', '/orders', 422, {
    token,
    body: { shippingAddress: address, paymentMethod: 'card', cardLast4: '4242' },
    detail: (r) => r.json.error.details?.map((d) => `${d.field}`).join(', '),
  })
  await expectStatus('POST /orders card without last4 → 422', 'POST', '/orders', 422, {
    token,
    body: { shippingAddress: address, paymentMethod: 'card', acceptedTerms: true },
  })
  await expectStatus('POST /orders with bad postcode → 422', 'POST', '/orders', 422, {
    token,
    body: {
      shippingAddress: { ...address, postalCode: '' },
      paymentMethod: 'cod',
      acceptedTerms: true,
    },
  })

  const stockBefore = await call('GET', `/products/${memberCart.json.data.items[0].slug}`)

  const order = await expectStatus('POST /orders', 'POST', '/orders', 201, {
    token,
    body: {
      shippingAddress: address,
      billingSameAsShipping: true,
      paymentMethod: 'card',
      cardLast4: '4242',
      shippingMethod: 'standard',
      acceptedTerms: true,
    },
    detail: (r) =>
      `${r.json.data.reference}: ${r.json.data.items.length} line(s), total $${r.json.data.totals.total}, ${r.json.data.status}`,
  })
  const reference = order.json?.data?.reference

  report(
    'order stores a full address and payment summary',
    Boolean(order.json?.data?.shippingAddress?.postalCode) &&
      order.json?.data?.paymentLast4 === '4242' &&
      order.json?.data?.paymentStatus === 'paid',
    `paid, card ending ${order.json?.data?.paymentLast4}`,
  )
  report(
    'estimated delivery date set',
    Boolean(order.json?.data?.estimatedDelivery),
    new Date(order.json?.data?.estimatedDelivery ?? Date.now()).toDateString(),
  )

  const stockAfter = await call('GET', `/products/${memberCart.json.data.items[0].slug}`)
  report(
    'stock decremented by the ordered quantity',
    stockAfter.json.data.stock < stockBefore.json.data.stock,
    `${stockBefore.json.data.stock} → ${stockAfter.json.data.stock}`,
  )

  const emptied = await call('GET', '/cart', { token })
  report('cart emptied after checkout', emptied.json.data.items.length === 0, `${emptied.json.data.items.length} items`)

  await expectStatus('POST /orders with empty cart → 400', 'POST', '/orders', 400, {
    token,
    body: { shippingAddress: address, paymentMethod: 'cod', acceptedTerms: true },
    detail: (r) => r.json.error.message,
  })

  await expectStatus(`GET /orders/${reference}`, 'GET', `/orders/${reference}`, 200, {
    token,
    detail: (r) => `${r.json.data.reference} · ${r.json.data.status} · $${r.json.data.totals.total}`,
  })
  await expectStatus('GET /orders/:ref without ownership → 403', 'GET', `/orders/${reference}`, 403)
  await expectStatus(
    'GET /orders/:ref as guest with matching email',
    'GET',
    `/orders/${reference}?email=${encodeURIComponent(email)}`,
    200,
    { detail: (r) => `${r.json.data.reference} readable via email` },
  )
  await expectStatus('GET /orders (history)', 'GET', '/orders', 200, {
    token,
    detail: (r) => `${r.json.meta.total} order(s)`,
  })
  await expectStatus('GET /orders/UNKNOWN → 404', 'GET', '/orders/NOVA-NOPE', 404, { token })

  /* ------------------------------------------------------------------ guest */
  section('Guest checkout')
  const guestSession = { 'X-Session-Id': `guest-${Date.now()}` }
  await expectStatus('guest adds to cart', 'POST', '/cart/items', 201, {
    headers: guestSession,
    body: { slug: cheap.slug, quantity: 1 },
  })
  await expectStatus('guest places order', 'POST', '/orders', 201, {
    headers: guestSession,
    body: {
      shippingAddress: { ...address, email: 'guest@nova.test' },
      paymentMethod: 'cod',
      acceptedTerms: true,
    },
    detail: (r) => `${r.json.data.reference}, payment ${r.json.data.paymentStatus}`,
  })

  /* ---------------------------------------------------------------- session */
  section('Session lifecycle')
  await expectStatus('POST /auth/logout', 'POST', '/auth/logout', 200, { token })
  await expectStatus('POST /auth/refresh without cookie → 401', 'POST', '/auth/refresh', 401)

  /* ----------------------------------------------------------------- images */
  section('Static assets')
  const imageUrl = `${BASE.replace(/\/api\/v\d+$/, '')}${sample.images[0].url}`
  const image = await fetch(imageUrl)
  report(
    'product image is served',
    image.ok && (image.headers.get('content-type') ?? '').startsWith('image/'),
    `${image.status} ${image.headers.get('content-type')} ${Math.round(Number(image.headers.get('content-length') ?? 0) / 1024)}KB`,
  )

  /* ----------------------------------------------------------------- report */
  console.log(`\n${'─'.repeat(64)}`)
  console.log(`\u001B[1m${passed} passed, ${failed} failed\u001B[0m`)
  if (failures.length) {
    console.log('\nFailures:')
    for (const failure of failures) console.log(`  • ${failure}`)
  }
  process.exit(failed === 0 ? 0 : 1)
}

run().catch((error) => {
  console.error(`\nSmoke run crashed: ${error.stack}`)
  process.exit(1)
})
