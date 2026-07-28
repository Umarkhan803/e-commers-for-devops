import { z } from 'zod'

/** Accepts `?brand=apple&brand=noise` and `?brand=apple,noise` alike. */
const csvList = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined
    const raw = Array.isArray(value) ? value : [value]
    const items = raw
      .flatMap((entry) => entry.split(','))
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
    return items.length ? [...new Set(items)] : undefined
  })

const boolish = z
  .union([z.string(), z.boolean()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === '') return undefined
    if (typeof value === 'boolean') return value
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
  })

const numeric = (options = {}) =>
  z.coerce
    .number({ message: 'Expected a number' })
    .min(options.min ?? 0)
    .max(options.max ?? Number.MAX_SAFE_INTEGER)
    .optional()

export const SORT_OPTIONS = [
  { id: 'relevance', label: 'Most relevant' },
  { id: 'popular', label: 'Most popular' },
  { id: 'newest', label: 'Newest arrivals' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'rating-desc', label: 'Highest rated' },
  { id: 'discount', label: 'Biggest discount' },
]

export const productQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    category: csvList,
    brand: csvList,
    tags: csvList,
    minPrice: numeric(),
    maxPrice: numeric(),
    minRating: numeric({ max: 5 }),
    inStock: boolish,
    freeShipping: boolish,
    onSale: boolish,
    sort: z
      .enum(SORT_OPTIONS.map((option) => option.id))
      .optional()
      .default('relevance'),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(60).optional().default(12),
    includeFacets: boolish,
  })
  .refine(
    (value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice,
    { message: 'minPrice must not be greater than maxPrice', path: ['minPrice'] },
  )

export const suggestQuerySchema = z.object({
  q: z.string().trim().min(1, 'A search term is required').max(120),
  limit: z.coerce.number().int().min(1).max(12).optional().default(6),
})

export const slugParamSchema = z.object({
  slug: z.string().trim().min(1).max(160),
})

export const reviewBodySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().default(''),
  body: z.string().trim().min(10, 'Please write at least 10 characters').max(2000),
  author: z.string().trim().min(2).max(80).optional(),
})
