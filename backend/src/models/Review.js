import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    author: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: '', trim: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    verifiedPurchase: { type: Boolean, default: false },
    helpfulCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  },
)

// One review per customer per product, but only for signed-in reviewers.
reviewSchema.index(
  { product: 1, user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } },
)
reviewSchema.index({ product: 1, createdAt: -1 })

export const Review = mongoose.model('Review', reviewSchema)
