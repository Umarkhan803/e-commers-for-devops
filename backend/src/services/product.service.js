import { Product } from '../models/Product.js'
import { Category, Brand } from '../models/Taxonomy.js'
import { SORT_OPTIONS } from '../validators/product.validators.js'

const SORT_STAGES = {
  popular: { salesCount: -1, rating: -1 },
  newest: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  'rating-desc': { rating: -1, reviewCount: -1 },
}

const RATING_BUCKETS = [4.5, 4, 3.5, 3]

/**
 * Translates validated query parameters into a MongoDB filter document.
 *
 * Every filter is additive, so a keyword search combines with category, brand,
 * price, rating, stock and shipping constraints in a single query.
 */
export function buildProductFilter(query = {}) {
  const filter = { isActive: true }

  if (query.q) filter.$text = { $search: query.q }
  if (query.category?.length) filter.category = { $in: query.category }
  if (query.brand?.length) filter.brandSlug = { $in: query.brand }
  if (query.tags?.length) filter.tags = { $in: query.tags }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {}
    if (query.minPrice !== undefined) filter.price.$gte = query.minPrice
    if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice
  }

  if (query.minRating !== undefined) filter.rating = { $gte: query.minRating }
  if (query.inStock === true) filter.stock = { $gt: 0 }
  if (query.freeShipping === true) filter.freeShipping = true
  if (query.onSale === true) filter.$expr = { $gt: ['$compareAtPrice', '$price'] }

  return filter
}

function buildSort(query) {
  if (query.sort === 'relevance') {
    // Text relevance only exists when a keyword was supplied.
    return query.q ? { score: { $meta: 'textScore' }, rating: -1 } : { salesCount: -1, rating: -1 }
  }
  if (query.sort === 'discount') return { discountRatio: -1, rating: -1 }
  return SORT_STAGES[query.sort] ?? { salesCount: -1 }
}

/** Fetch a page of products for any combination of filters. */
export async function findProducts(query) {
  const filter = buildProductFilter(query)
  const sort = buildSort(query)
  const skip = (query.page - 1) * query.limit

  const projection = {}
  if (query.q) projection.score = { $meta: 'textScore' }

  const needsDiscountRatio = query.sort === 'discount'

  let items
  if (needsDiscountRatio) {
    // Sorting by relative discount needs a computed field, so use aggregation.
    items = await Product.aggregate([
      { $match: filter },
      {
        $addFields: {
          discountRatio: {
            $cond: [
              { $gt: ['$compareAtPrice', '$price'] },
              {
                $divide: [{ $subtract: ['$compareAtPrice', '$price'] }, '$compareAtPrice'],
              },
              0,
            ],
          },
        },
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: query.limit },
    ])
    items = items.map((document) => Product.hydrate(document))
  } else {
    items = await Product.find(filter, projection).sort(sort).skip(skip).limit(query.limit)
  }

  const total = await Product.countDocuments(filter)

  return {
    items: items.map((item) => item.toJSON()),
    total,
  }
}

/**
 * Every filter option the storefront can offer, with a live count for each
 * derived from a single aggregation pass. `scopeQuery` narrows the counts to the
 * shopper's current selection; omit it for the unfiltered catalogue view.
 */
export async function getFilterMetadata(scopeQuery = {}) {
  const scope = buildProductFilter(scopeQuery)

  const [facets] = await Product.aggregate([
    { $match: { isActive: true } },
    {
      $facet: {
        categories: [
          { $group: { _id: '$category', count: { $sum: 1 }, minPrice: { $min: '$price' }, maxPrice: { $max: '$price' } } },
          { $sort: { count: -1 } },
        ],
        brands: [
          { $group: { _id: { slug: '$brandSlug', name: '$brand' }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        priceRange: [
          {
            $group: {
              _id: null,
              min: { $min: '$price' },
              max: { $max: '$price' },
              average: { $avg: '$price' },
            },
          },
        ],
        tags: [
          { $unwind: '$tags' },
          { $group: { _id: '$tags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        availability: [
          {
            $group: {
              _id: null,
              inStock: { $sum: { $cond: [{ $gt: ['$stock', 0] }, 1, 0] } },
              outOfStock: { $sum: { $cond: [{ $gt: ['$stock', 0] }, 0, 1] } },
              freeShipping: { $sum: { $cond: ['$freeShipping', 1, 0] } },
              onSale: { $sum: { $cond: [{ $gt: ['$compareAtPrice', '$price'] }, 1, 0] } },
            },
          },
        ],
        colors: [
          { $unwind: '$colors' },
          { $group: { _id: '$colors', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 24 },
        ],
        total: [{ $count: 'value' }],
      },
    },
  ])

  const [categoryDocs, brandDocs, ratingCounts, scopedTotal] = await Promise.all([
    Category.find().sort({ order: 1, name: 1 }).lean(),
    Brand.find().sort({ name: 1 }).lean(),
    Promise.all(
      RATING_BUCKETS.map(async (threshold) => ({
        value: threshold,
        label: `${threshold} & up`,
        count: await Product.countDocuments({ isActive: true, rating: { $gte: threshold } }),
      })),
    ),
    Product.countDocuments(scope),
  ])

  const categoryMeta = new Map(categoryDocs.map((document) => [document.slug, document]))
  const brandMeta = new Map(brandDocs.map((document) => [document.slug, document]))

  const priceRange = facets.priceRange[0] ?? { min: 0, max: 0, average: 0 }
  const availability = facets.availability[0] ?? {
    inStock: 0,
    outOfStock: 0,
    freeShipping: 0,
    onSale: 0,
  }

  return {
    totals: {
      products: facets.total[0]?.value ?? 0,
      matchingCurrentSelection: scopedTotal,
    },
    categories: facets.categories.map((entry) => ({
      id: entry._id,
      slug: entry._id,
      name: categoryMeta.get(entry._id)?.name ?? entry._id,
      blurb: categoryMeta.get(entry._id)?.blurb ?? '',
      icon: categoryMeta.get(entry._id)?.icon ?? 'package',
      count: entry.count,
      minPrice: Math.floor(entry.minPrice),
      maxPrice: Math.ceil(entry.maxPrice),
    })),
    brands: facets.brands.map((entry) => ({
      id: entry._id.slug,
      slug: entry._id.slug,
      name: brandMeta.get(entry._id.slug)?.name ?? entry._id.name,
      origin: brandMeta.get(entry._id.slug)?.origin ?? '',
      blurb: brandMeta.get(entry._id.slug)?.blurb ?? '',
      count: entry.count,
    })),
    price: {
      min: Math.floor(priceRange.min ?? 0),
      max: Math.ceil(priceRange.max ?? 0),
      average: Math.round(priceRange.average ?? 0),
    },
    ratings: ratingCounts,
    tags: facets.tags.map((entry) => ({ id: entry._id, name: entry._id, count: entry.count })),
    colors: facets.colors.map((entry) => ({ id: entry._id, name: entry._id, count: entry.count })),
    availability: {
      inStock: availability.inStock,
      outOfStock: availability.outOfStock,
      freeShipping: availability.freeShipping,
      onSale: availability.onSale,
    },
    sortOptions: SORT_OPTIONS,
  }
}

/** Lightweight payload for the header's type-ahead search. */
export async function getSuggestions(term, limit) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(escaped, 'i')

  const products = await Product.find(
    {
      isActive: true,
      $or: [{ name: pattern }, { brand: pattern }, { tags: pattern }],
    },
    { name: 1, slug: 1, brand: 1, price: 1, compareAtPrice: 1, images: { $slice: 1 }, category: 1, rating: 1 },
  )
    .sort({ salesCount: -1, rating: -1 })
    .limit(limit)
    .lean()

  const [categories, brands] = await Promise.all([
    Category.find({ $or: [{ name: pattern }, { slug: pattern }] }, { name: 1, slug: 1 })
      .limit(3)
      .lean(),
    Brand.find({ $or: [{ name: pattern }, { slug: pattern }] }, { name: 1, slug: 1 })
      .limit(3)
      .lean(),
  ])

  return {
    term,
    products: products.map((product) => ({
      id: product._id.toString(),
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      rating: product.rating,
      thumbnail: product.images?.[0]?.url ?? null,
    })),
    categories: categories.map((entry) => ({ slug: entry.slug, name: entry.name })),
    brands: brands.map((entry) => ({ slug: entry.slug, name: entry.name })),
  }
}

export async function getProductBySlug(slug) {
  return Product.findOne({ slug: slug.toLowerCase(), isActive: true })
}

/** Same category first, then same brand, never the product itself. */
export async function getRelatedProducts(product, limit = 4) {
  const sameCategory = await Product.find({
    _id: { $ne: product._id },
    isActive: true,
    category: product.category,
  })
    .sort({ rating: -1, salesCount: -1 })
    .limit(limit)

  if (sameCategory.length >= limit) return sameCategory.map((item) => item.toJSON())

  const fillers = await Product.find({
    _id: { $nin: [product._id, ...sameCategory.map((item) => item._id)] },
    isActive: true,
    brandSlug: product.brandSlug,
  })
    .sort({ rating: -1 })
    .limit(limit - sameCategory.length)

  return [...sameCategory, ...fillers].map((item) => item.toJSON())
}
