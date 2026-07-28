import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' },
    fullName: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: 'United States' },
    phone: String,
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },

    addresses: { type: [addressSchema], default: [] },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

    newsletterOptIn: { type: Boolean, default: false },
    lastLoginAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.__v
        delete ret.passwordHash
        return ret
      },
    },
  },
)

userSchema.statics.hashPassword = (plain) => bcrypt.hash(plain, 12)

userSchema.methods.verifyPassword = function verifyPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash)
}

export const User = mongoose.model('User', userSchema)
