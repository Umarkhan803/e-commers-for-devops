import mongoose from 'mongoose'

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    sourceUrl: { type: String, default: '' },
  },
  { _id: false },
)

const productSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },

    brand: { type: String, required: true, trim: true, index: true },
    brandSlug: { type: String, required: true, lowercase: true, index: true },
    category: { type: String, required: true, lowercase: true, trim: true, index: true },

    shortDescription: { type: String, default: '' },
    description: { type: String, default: '' },
    highlights: { type: [String], default: [] },
    // Free-form key/value spec table; shape differs per category.
    specs: { type: Map, of: String, default: () => new Map() },
    colors: { type: [String], default: [] },

    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: null, min: 0 },
    currency: { type: String, default: 'USD' },

    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    ratingSum: { type: Number, default: 0, min: 0 },

    stock: { type: Number, default: 0, min: 0 },
    tags: { type: [String], default: [], index: true },

    freeShipping: { type: Boolean, default: false },
    deliveryDays: { type: Number, default: 4 },

    images: { type: [imageSchema], default: [] },
    imageSource: { type: String, default: 'local' },

    isActive: { type: Boolean, default: true, index: true },
    salesCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.__v
        delete ret.ratingSum
        // Map serialises to an object only when converted explicitly.
        if (ret.specs instanceof Map) ret.specs = Object.fromEntries(ret.specs)
        return ret
      },
    },
  },
)

/* --------------------------------------------------------------- virtuals */

productSchema.virtual('inStock').get(function inStock() {
  return this.stock > 0
})

productSchema.virtual('discountPercent').get(function discountPercent() {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) return 0
  return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100)
})

productSchema.virtual('thumbnail').get(function thumbnail() {
  return this.images?.[0]?.url ?? null
})

/* ---------------------------------------------------------------- indexes */

// Weighted text index drives `?q=` keyword search.
productSchema.index(
  { name: 'text', brand: 'text', shortDescription: 'text', description: 'text', tags: 'text' },
  {
    name: 'product_search',
    weights: { name: 10, brand: 6, tags: 4, shortDescription: 2, description: 1 },
  },
)

// Covers the common storefront query: active products in a category, sorted.
productSchema.index({ isActive: 1, category: 1, price: 1 })
productSchema.index({ isActive: 1, brandSlug: 1, price: 1 })
productSchema.index({ isActive: 1, rating: -1 })
productSchema.index({ isActive: 1, createdAt: -1 })
productSchema.index({ isActive: 1, salesCount: -1 })

productSchema.pre('validate', function setBrandSlug(next) {
  if (this.brand && !this.brandSlug) {
    this.brandSlug = this.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  }
  next()
})

export const Product = mongoose.model('Product', productSchema)
