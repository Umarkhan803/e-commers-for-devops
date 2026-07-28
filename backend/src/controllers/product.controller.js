import { asyncHandler, sendSuccess, buildPageMeta } from '../utils/http.js'
import { ApiError } from '../utils/ApiError.js'
import {
  findProducts,
  getFilterMetadata,
  getSuggestions,
  getProductBySlug,
  getRelatedProducts,
} from '../services/product.service.js'
import { Review } from '../models/Review.js'
import { Product } from '../models/Product.js'
import { Category, Brand } from '../models/Taxonomy.js'
import { bumpCatalogueVersion } from '../services/cache.service.js'

/**
 * GET /products
 *
 * The catalogue "fetch all" endpoint. Accepts every filter at once:
 *   q, category, brand, tags, minPrice, maxPrice, minRating,
 *   inStock, freeShipping, onSale, sort, page, limit, includeFacets
 */
export const listProducts = asyncHandler(async (req, res) => {
  const query = req.validatedQuery
  const { items, total } = await findProducts(query)

  const meta = {
    ...buildPageMeta({ page: query.page, limit: query.limit, total }),
    sort: query.sort,
    appliedFilters: Object.fromEntries(
      Object.entries({
        q: query.q,
        category: query.category,
        brand: query.brand,
        tags: query.tags,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        minRating: query.minRating,
        inStock: query.inStock,
        freeShipping: query.freeShipping,
        onSale: query.onSale,
      }).filter(([, value]) => value !== undefined),
    ),
  }

  // Opt-in so the common case does not pay for the facet aggregation.
  if (query.includeFacets) meta.facets = await getFilterMetadata(query)

  sendSuccess(res, items, { meta })
})

/**
 * GET /products/filters
 *
 * Fetches every filter option available in the catalogue with live counts, so
 * the filter panel can be rendered entirely from the API. Pass any subset of
 * the product filters to scope the "matching current selection" total.
 */
export const listFilters = asyncHandler(async (req, res) => {
  const metadata = await getFilterMetadata(req.validatedQuery ?? {})
  sendSuccess(res, metadata)
})

/** GET /products/suggest — type-ahead results for the header search. */
export const suggestProducts = asyncHandler(async (req, res) => {
  const { q, limit } = req.validatedQuery
  sendSuccess(res, await getSuggestions(q, limit))
})

/** GET /products/:slug */
export const getProduct = asyncHandler(async (req, res) => {
  const product = await getProductBySlug(req.params.slug)
  if (!product) throw ApiError.notFound(`No product found for "${req.params.slug}"`)

  const [related, reviews] = await Promise.all([
    getRelatedProducts(product),
    Review.find({ product: product._id }).sort({ createdAt: -1 }).limit(8),
  ])

  sendSuccess(res, {
    ...product.toJSON(),
    related,
    reviews: reviews.map((review) => review.toJSON()),
  })
})

/** GET /products/:slug/related */
export const getRelated = asyncHandler(async (req, res) => {
  const product = await getProductBySlug(req.params.slug)
  if (!product) throw ApiError.notFound(`No product found for "${req.params.slug}"`)
  sendSuccess(res, await getRelatedProducts(product, 8))
})

/** GET /products/:slug/reviews */
export const listReviews = asyncHandler(async (req, res) => {
  const product = await getProductBySlug(req.params.slug)
  if (!product) throw ApiError.notFound(`No product found for "${req.params.slug}"`)

  const reviews = await Review.find({ product: product._id }).sort({ createdAt: -1 }).limit(50)

  const distribution = await Review.aggregate([
    { $match: { product: product._id } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ])

  sendSuccess(res, {
    average: product.rating,
    total: product.reviewCount,
    distribution: [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: distribution.find((entry) => entry._id === stars)?.count ?? 0,
    })),
    reviews: reviews.map((review) => review.toJSON()),
  })
})

/** POST /products/:slug/reviews — requires a signed-in customer. */
export const createReview = asyncHandler(async (req, res) => {
  const product = await getProductBySlug(req.params.slug)
  if (!product) throw ApiError.notFound(`No product found for "${req.params.slug}"`)

  const existing = await Review.findOne({ product: product._id, user: req.user.id })
  if (existing) throw ApiError.conflict('You have already reviewed this product')

  const review = await Review.create({
    product: product._id,
    user: req.user.id,
    author: req.body.author ?? req.user.name,
    rating: req.body.rating,
    title: req.body.title,
    body: req.body.body,
    verifiedPurchase: false,
  })

  // Keep the denormalised aggregate on the product in step with the new review.
  const ratingSum = (product.ratingSum ?? product.rating * product.reviewCount) + review.rating
  const reviewCount = product.reviewCount + 1
  product.ratingSum = ratingSum
  product.reviewCount = reviewCount
  product.rating = Number((ratingSum / reviewCount).toFixed(2))
  await product.save()

  await bumpCatalogueVersion()

  sendSuccess(res, review.toJSON(), { status: 201 })
})

/** GET /categories */
export const listCategories = asyncHandler(async (_req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ order: 1, name: 1 }).lean(),
    Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 }, minPrice: { $min: '$price' } } },
    ]),
  ])

  const countMap = new Map(counts.map((entry) => [entry._id, entry]))

  sendSuccess(
    res,
    categories.map((category) => ({
      id: category.slug,
      slug: category.slug,
      name: category.name,
      blurb: category.blurb,
      icon: category.icon,
      count: countMap.get(category.slug)?.count ?? 0,
      startingPrice: Math.floor(countMap.get(category.slug)?.minPrice ?? 0),
    })),
  )
})

/** GET /brands */
export const listBrands = asyncHandler(async (_req, res) => {
  const [brands, counts] = await Promise.all([
    Brand.find().sort({ name: 1 }).lean(),
    Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$brandSlug', count: { $sum: 1 }, rating: { $avg: '$rating' } } },
    ]),
  ])

  const countMap = new Map(counts.map((entry) => [entry._id, entry]))

  sendSuccess(
    res,
    brands.map((brand) => ({
      id: brand.slug,
      slug: brand.slug,
      name: brand.name,
      origin: brand.origin,
      blurb: brand.blurb,
      count: countMap.get(brand.slug)?.count ?? 0,
      averageRating: Number((countMap.get(brand.slug)?.rating ?? 0).toFixed(2)),
    })),
  )
})
