/**
 * Loads `catalogue.json` into MongoDB.
 *
 * Idempotent: products are upserted by slug, so re-running refreshes the
 * catalogue without duplicating anything. Pass --drop to start from scratch.
 *
 *   npm run seed          upsert
 *   npm run seed:fresh    drop collections first
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { connectMongo, disconnectMongo } from '../config/mongo.js'
import { connectRedis, disconnectRedis } from '../config/redis.js'
import { Product } from '../models/Product.js'
import { Category, Brand } from '../models/Taxonomy.js'
import { Review } from '../models/Review.js'
import { User } from '../models/User.js'
import { bumpCatalogueVersion } from '../services/cache.service.js'
import { logger } from '../utils/logger.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const CATALOGUE = path.join(HERE, 'catalogue.json')

const slugify = (value) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

/* --------------------------------------------------------- review generation */

const REVIEW_AUTHORS = [
  'Aarav Sharma', 'Priya Nair', 'James Whitfield', 'Mei Lin', 'Daniel Okafor',
  'Sofia Almeida', 'Rohan Kapoor', 'Emily Carter', 'Yusuf Demir', 'Ana Torres',
  'Liam O\'Connell', 'Hana Sato', 'Marcus Bell', 'Neha Verma', 'Oliver Bennett',
]

const REVIEW_TEMPLATES = {
  5: [
    { title: 'Exactly what I hoped for', body: 'Arrived a day early and the build quality is better than the photos suggest. Two weeks in and I have no complaints at all — it does everything the listing claims.' },
    { title: 'Worth every penny', body: 'I went back and forth on the price for a while and I am glad I stopped hesitating. The difference against my old one is not subtle.' },
    { title: 'Replaced my old one after four years', body: 'Same brand, much better product. Setup took about five minutes and it has been faultless since.' },
  ],
  4: [
    { title: 'Very good, one small gripe', body: 'No regrets overall. The only thing I would change is the battery indicator, which is not as precise as I would like. Everything else is solid.' },
    { title: 'Solid choice', body: 'Does the job well. Packaging was a bit excessive and it took a few days to get used to the controls, but I would buy it again.' },
    { title: 'Good value at this price', body: 'You can spend more and get marginally better, but for what I need day to day this hits the right balance.' },
  ],
  3: [
    { title: 'Decent but not remarkable', body: 'It works and nothing is wrong with it, but it did not wow me either. If it goes on sale it is an easy recommendation.' },
    { title: 'Fine for casual use', body: 'Good enough for everyday use. If you are doing anything demanding you will probably want to look at the tier above.' },
  ],
}

function pseudoRandom(seed) {
  let state = seed
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296
    return state / 4_294_967_296
  }
}

/**
 * Generates a deterministic review set whose average matches the product's
 * stored rating, so the listing and the detail page never contradict each other.
 */
function buildReviews(product, index) {
  const random = pseudoRandom(index * 7919 + 13)
  const count = 3 + Math.floor(random() * 4)
  const reviews = []

  for (let position = 0; position < count; position += 1) {
    // Cluster ratings around the product's average.
    const jitter = random() < 0.7 ? 0 : random() < 0.6 ? -1 : 1
    const stars = Math.max(3, Math.min(5, Math.round(product.rating) + jitter))
    const pool = REVIEW_TEMPLATES[stars] ?? REVIEW_TEMPLATES[4]
    const template = pool[Math.floor(random() * pool.length)]

    const daysAgo = Math.floor(random() * 210) + 2
    const createdAt = new Date(Date.now() - daysAgo * 86_400_000)

    reviews.push({
      author: REVIEW_AUTHORS[Math.floor(random() * REVIEW_AUTHORS.length)],
      rating: stars,
      title: template.title,
      body: template.body,
      verifiedPurchase: random() > 0.25,
      helpfulCount: Math.floor(random() * 48),
      createdAt,
      updatedAt: createdAt,
    })
  }

  return reviews
}

/* ------------------------------------------------------------------- seeding */

const DEMO_USER = {
  name: 'Ava Mitchell',
  email: 'demo@nova.test',
  password: 'Password123',
}

async function seed() {
  const drop = process.argv.includes('--drop')

  await connectMongo()
  await connectRedis()

  const catalogue = JSON.parse(await readFile(CATALOGUE, 'utf8'))
  logger.info(
    `Catalogue generated ${catalogue.generatedAt} — ${catalogue.products.length} products`,
  )

  if (drop) {
    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
      Brand.deleteMany({}),
      Review.deleteMany({}),
    ])
    logger.warn('Dropped products, categories, brands and reviews')
  }

  /* categories and brands */
  await Category.bulkWrite(
    catalogue.categories.map((category, order) => ({
      updateOne: {
        filter: { slug: category.id },
        update: {
          $set: {
            slug: category.id,
            name: category.name,
            blurb: category.blurb,
            icon: category.icon,
            order,
          },
        },
        upsert: true,
      },
    })),
  )

  await Brand.bulkWrite(
    catalogue.brands.map((brand) => ({
      updateOne: {
        filter: { slug: brand.id },
        update: {
          $set: { slug: brand.id, name: brand.name, origin: brand.origin, blurb: brand.blurb },
        },
        upsert: true,
      },
    })),
  )
  logger.info(`Upserted ${catalogue.categories.length} categories, ${catalogue.brands.length} brands`)

  /* products */
  await Product.bulkWrite(
    catalogue.products.map((product, index) => ({
      updateOne: {
        filter: { slug: product.slug },
        update: {
          $set: {
            ...product,
            brandSlug: slugify(product.brand),
            specs: product.specs,
            ratingSum: Math.round(product.rating * product.reviewCount),
            // Seeded popularity, so "most popular" sorting has something to sort by.
            salesCount: Math.max(0, product.reviewCount * 2 - index * 7),
            isActive: true,
          },
        },
        upsert: true,
      },
    })),
  )

  const products = await Product.find()
  logger.info(`Upserted ${products.length} products`)

  /* reviews */
  let reviewCount = 0
  for (const [index, product] of products.entries()) {
    const existing = await Review.countDocuments({ product: product._id })
    if (existing > 0) continue

    const reviews = buildReviews(product, index).map((review) => ({
      ...review,
      product: product._id,
    }))
    await Review.insertMany(reviews)
    reviewCount += reviews.length
  }
  logger.info(reviewCount ? `Inserted ${reviewCount} reviews` : 'Reviews already present, skipped')

  /* demo account */
  const existingUser = await User.findOne({ email: DEMO_USER.email })
  if (!existingUser) {
    await User.create({
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      passwordHash: await User.hashPassword(DEMO_USER.password),
      newsletterOptIn: true,
    })
    logger.info(`Created demo account ${DEMO_USER.email} / ${DEMO_USER.password}`)
  } else {
    logger.info(`Demo account ${DEMO_USER.email} already exists`)
  }

  // Ensure the text and compound indexes exist before the first query.
  await Promise.all([Product.syncIndexes(), Review.syncIndexes()])
  logger.info('Indexes synchronised')

  await bumpCatalogueVersion()

  const summary = await Product.aggregate([
    { $group: { _id: '$brand', products: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
    { $sort: { products: -1 } },
  ])
  for (const row of summary) {
    logger.info(`  ${row._id.padEnd(10)} ${String(row.products).padStart(2)} products, avg $${row.avgPrice.toFixed(2)}`)
  }
}

seed()
  .then(async () => {
    logger.info('Seed complete')
    await Promise.allSettled([disconnectMongo(), disconnectRedis()])
    process.exit(0)
  })
  .catch(async (error) => {
    logger.error(`Seed failed: ${error.stack ?? error.message}`)
    await Promise.allSettled([disconnectMongo(), disconnectRedis()])
    process.exit(1)
  })
