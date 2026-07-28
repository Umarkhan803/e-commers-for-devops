/**
 * Filter state lives in the URL query string, which makes every view linkable
 * and the back button behave. Matching and sorting happen in MongoDB, so this
 * module is only concerned with translating between the two representations.
 */

export const FILTER_DEFAULTS = {
  query: '',
  categories: [],
  brands: [],
  minRating: 0,
  availability: 'all', // 'all' | 'in-stock' | 'on-sale'
  freeShippingOnly: false,
  sort: 'relevance',
}

/** Price defaults depend on the catalogue, so bounds are supplied by the caller. */
export function defaultFilters(priceBounds) {
  return { ...FILTER_DEFAULTS, minPrice: priceBounds.min, maxPrice: priceBounds.max }
}

export function activeFilterCount(filters, priceBounds) {
  let count = filters.categories.length + filters.brands.length
  if (filters.minPrice > priceBounds.min) count += 1
  if (filters.maxPrice < priceBounds.max) count += 1
  if (filters.minRating) count += 1
  if (filters.availability !== 'all') count += 1
  if (filters.freeShippingOnly) count += 1
  return count
}

export function filtersToSearchParams(filters, priceBounds) {
  const params = new URLSearchParams()
  if (filters.query) params.set('q', filters.query)
  if (filters.categories.length) params.set('category', filters.categories.join(','))
  if (filters.brands.length) params.set('brand', filters.brands.join(','))
  if (filters.minPrice > priceBounds.min) params.set('min', String(filters.minPrice))
  if (filters.maxPrice < priceBounds.max) params.set('max', String(filters.maxPrice))
  if (filters.minRating) params.set('rating', String(filters.minRating))
  if (filters.availability !== 'all') params.set('availability', filters.availability)
  if (filters.freeShippingOnly) params.set('shipping', 'free')
  if (filters.sort !== FILTER_DEFAULTS.sort) params.set('sort', filters.sort)
  return params
}

export function filtersFromSearchParams(params, priceBounds) {
  const list = (key) => (params.get(key) ? params.get(key).split(',').filter(Boolean) : [])
  const number = (key, fallback) => {
    const raw = params.get(key)
    const parsed = Number(raw)
    return raw !== null && Number.isFinite(parsed) ? parsed : fallback
  }

  return {
    query: params.get('q') ?? '',
    categories: list('category'),
    brands: list('brand'),
    minPrice: number('min', priceBounds.min),
    maxPrice: number('max', priceBounds.max),
    minRating: number('rating', 0),
    availability: params.get('availability') ?? 'all',
    freeShippingOnly: params.get('shipping') === 'free',
    sort: params.get('sort') ?? FILTER_DEFAULTS.sort,
  }
}
