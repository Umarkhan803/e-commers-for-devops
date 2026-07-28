import { asyncHandler, sendSuccess } from '../utils/http.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/User.js'
import { Product } from '../models/Product.js'

const WISHLIST_FIELDS = 'name slug brand price compareAtPrice rating reviewCount images stock'

/** GET /wishlist */
export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('wishlist', WISHLIST_FIELDS)
  if (!user) throw ApiError.unauthorized('Account no longer exists')
  sendSuccess(res, user.wishlist.map((product) => product.toJSON()))
})

/** POST /wishlist/:slug */
export const addToWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug.toLowerCase() })
  if (!product) throw ApiError.notFound('That product does not exist')

  // addToSet keeps the operation idempotent.
  await User.updateOne({ _id: req.user.id }, { $addToSet: { wishlist: product._id } })

  const user = await User.findById(req.user.id).populate('wishlist', WISHLIST_FIELDS)
  sendSuccess(res, user.wishlist.map((entry) => entry.toJSON()), { status: 201 })
})

/** DELETE /wishlist/:slug */
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug.toLowerCase() })
  if (!product) throw ApiError.notFound('That product does not exist')

  await User.updateOne({ _id: req.user.id }, { $pull: { wishlist: product._id } })

  const user = await User.findById(req.user.id).populate('wishlist', WISHLIST_FIELDS)
  sendSuccess(res, user.wishlist.map((entry) => entry.toJSON()))
})
