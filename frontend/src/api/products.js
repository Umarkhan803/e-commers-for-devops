import { api, assetUrl } from './client'

const LOW_STOCK_THRESHOLD = 12

const titleCase = (slug = '') =>
  slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

/**
 * Reshapes an API product into the shape the UI components consume. The two
 * differ in a handful of places — the API is explicit (`compareAtPrice`,
 * `images[]`) where the components want shorthand (`compareAt`, `image`,
 * `gallery`) — so the translation lives here rather than in every component.
 */
export function normaliseProduct(product) {
  if (!product) return null

  const gallery = (product.images ?? []).map((image) => assetUrl(image.url)).filter(Boolean)

  return {
    ...product,
    compareAt: product.compareAtPrice ?? null,
    image: gallery[0] ?? '',
    gallery: gallery.length ? gallery : [''],
    inStock: product.stock > 0,
    lowStock: product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD,
    categoryName: titleCase(product.category),
    specs: product.specs ?? {},
    highlights: product.highlights ?? [],
    colors: product.colors?.length ? product.colors : ['Standard'],
    reviews: (product.reviews ?? []).map(normaliseReview),
    related: (product.related ?? []).map(normaliseProduct),
  }
}

export function normaliseReview(review) {
  return {
    id: review.id,
    author: review.author,
    rating: review.rating,
    title: review.title,
    body: review.body,
    helpful: review.helpfulCount ?? 0,
    verified: review.verifiedPurchase ?? false,
    date: review.createdAt,
  }
}

/**
 * Maps UI filter state onto the API's query parameters.
 *
 * `priceBounds` is needed because the UI treats "slider at the extremes" as
 * "no price filter", and the extremes come from the catalogue itself.
 */
export function filtersToParams(filters, priceBounds, { page = 1, limit = 12 } = {}) {
  const availability = filters.availability ?? 'all'

  return {
    q: filters.query?.trim() || undefined,
    category: filters.categories,
    brand: filters.brands,
    minPrice: filters.minPrice > priceBounds.min ? filters.minPrice : undefined,
    maxPrice: filters.maxPrice < priceBounds.max ? filters.maxPrice : undefined,
    minRating: filters.minRating || undefined,
    inStock: availability === 'in-stock' || undefined,
    onSale: availability === 'on-sale' || undefined,
    freeShipping: filters.freeShippingOnly || undefined,
    sort: filters.sort,
    page,
    limit,
  }
}

export async function fetchProducts(params, { signal } = {}) {
  const response = await api.get('/products', { params, signal })
  return {
    items: response.data.map(normaliseProduct),
    meta: response.meta,
  }
}

/** Every filter option in the catalogue, with live counts. */
export async function fetchFilterMetadata(params = {}, { signal } = {}) {
  const response = await api.get('/products/filters', { params, signal })
  return response.data
}

export async function fetchProduct(slug, { signal } = {}) {
  const response = await api.get(`/products/${encodeURIComponent(slug)}`, { signal })
  return normaliseProduct(response.data)
}

export async function fetchSuggestions(query, { signal, limit = 6 } = {}) {
  const response = await api.get('/products/suggest', { params: { q: query, limit }, signal })
  return {
    ...response.data,
    products: response.data.products.map((product) => ({
      ...product,
      image: assetUrl(product.thumbnail),
      categoryName: titleCase(product.category),
    })),
  }
}

export async function fetchReviews(slug, { signal } = {}) {
  const response = await api.get(`/products/${encodeURIComponent(slug)}/reviews`, { signal })
  return {
    ...response.data,
    reviews: response.data.reviews.map(normaliseReview),
  }
}

export async function submitReview(slug, review) {
  const response = await api.post(`/products/${encodeURIComponent(slug)}/reviews`, review)
  return normaliseReview(response.data)
}

export async function fetchCategories({ signal } = {}) {
  const response = await api.get('/categories', { signal })
  return response.data
}

export async function fetchBrands({ signal } = {}) {
  const response = await api.get('/brands', { signal })
  return response.data
}

export async function fetchPromotions({ signal } = {}) {
  const response = await api.get('/promotions', { signal })
  return response.data
}
