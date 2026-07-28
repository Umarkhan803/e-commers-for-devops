import mongoose from 'mongoose'

const jsonOptions = {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret.slug ?? ret._id.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
}

const categorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    blurb: { type: String, default: '' },
    icon: { type: String, default: 'package' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: jsonOptions },
)

const brandSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    origin: { type: String, default: '' },
    blurb: { type: String, default: '' },
  },
  { timestamps: true, toJSON: jsonOptions },
)

export const Category = mongoose.model('Category', categorySchema)
export const Brand = mongoose.model('Brand', brandSchema)
