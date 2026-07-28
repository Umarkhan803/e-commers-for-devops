import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    // Denormalised so a historical order still renders if the product changes.
    slug: String,
    name: String,
    brand: String,
    image: String,
    color: String,
    unitPrice: { type: Number, required: true },
    compareAtPrice: Number,
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false },
)

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'United States' },
  },
  { _id: false },
)

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

const orderSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, uppercase: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    email: { type: String, required: true, lowercase: true, index: true },

    items: { type: [orderItemSchema], required: true, validate: (value) => value.length > 0 },

    shippingAddress: { type: addressSchema, required: true },
    billingAddress: { type: addressSchema, default: null },

    paymentMethod: {
      type: String,
      enum: ['card', 'paypal', 'cod', 'upi'],
      required: true,
    },
    // Never store real card data; the last four digits are enough for receipts.
    paymentLast4: { type: String, default: null },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },

    shippingMethod: { type: String, enum: ['standard', 'express'], default: 'standard' },
    promoCode: { type: String, default: null },

    totals: {
      subtotal: { type: Number, required: true },
      savings: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      shipping: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      total: { type: Number, required: true },
      currency: { type: String, default: 'USD' },
    },

    status: { type: String, enum: ORDER_STATUSES, default: 'confirmed', index: true },
    timeline: {
      type: [
        {
          status: { type: String, enum: ORDER_STATUSES },
          note: String,
          at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    estimatedDelivery: Date,
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

orderSchema.index({ createdAt: -1 })

orderSchema.statics.generateReference = function generateReference() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6)
  const random = Math.random().toString(36).toUpperCase().slice(2, 6)
  return `NOVA-${stamp}${random}`
}

export const Order = mongoose.model('Order', orderSchema)
export { ORDER_STATUSES }
