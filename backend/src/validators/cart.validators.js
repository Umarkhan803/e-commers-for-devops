import { z } from 'zod'

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Expected a MongoDB object id')

export const addItemSchema = z
  .object({
    productId: objectId.optional(),
    slug: z.string().trim().min(1).max(160).optional(),
    quantity: z.coerce.number().int().min(1).max(20).optional().default(1),
    color: z.string().trim().max(60).optional(),
  })
  .refine((value) => value.productId || value.slug, {
    message: 'Provide either productId or slug',
    path: ['productId'],
  })

export const updateItemSchema = z.object({
  // Zero is how the client removes a line without a separate call.
  quantity: z.coerce.number().int().min(0).max(20),
  color: z.string().trim().max(60).optional(),
})

export const promoSchema = z.object({
  code: z.string().trim().max(40).nullable().optional(),
})

export const shippingSchema = z.object({
  shippingMethod: z.enum(['standard', 'express']),
})

export const productIdParamSchema = z.object({ productId: objectId })
