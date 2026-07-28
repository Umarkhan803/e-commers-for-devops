import mongoose from 'mongoose'

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, max: 20 },
    color: { type: String, default: '' },
    // Snapshot so a mid-session price change cannot silently alter the basket.
    unitPrice: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: null },
  },
  { _id: false },
)

const cartSchema = new mongoose.Schema(
  {
    // Exactly one of these identifies the basket owner.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    sessionId: { type: String, default: null, index: true },

    items: { type: [cartItemSchema], default: [] },
    promoCode: { type: String, default: null },
    shippingMethod: { type: String, enum: ['standard', 'express'], default: 'standard' },
  },
  { timestamps: true },
)

// Guest carts are disposable; drop them a fortnight after their last update.
cartSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 14, partialFilterExpression: { user: null } },
)

/**
 * Colour is part of a line's identity, so the same product in two colours is two
 * lines. Passing `undefined` matches on product alone, which lets a client
 * change a quantity without having to echo the colour back.
 */
cartSchema.methods.findItem = function findItem(productId, color) {
  return this.items.find((item) => {
    if (item.product.toString() !== String(productId)) return false
    return color === undefined ? true : (item.color ?? '') === color
  })
}

export const Cart = mongoose.model('Cart', cartSchema)
