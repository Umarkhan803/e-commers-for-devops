import { z } from 'zod'

const addressSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter the recipient name').max(80),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  phone: z.string().trim().min(7, 'Please enter a contact number').max(32),
  line1: z.string().trim().min(3, 'Please enter a street address').max(160),
  line2: z.string().trim().max(160).optional().default(''),
  city: z.string().trim().min(2, 'Please enter a city').max(80),
  state: z.string().trim().min(2, 'Please enter a state or region').max(80),
  postalCode: z.string().trim().min(3, 'Please enter a postal code').max(16),
  country: z.string().trim().max(80).optional().default('United States'),
})

export const createOrderSchema = z
  .object({
    shippingAddress: addressSchema,
    billingAddress: addressSchema.optional().nullable(),
    billingSameAsShipping: z.boolean().optional().default(true),
    paymentMethod: z.enum(['card', 'paypal', 'cod', 'upi']),
    // Only the last four digits are retained; nothing else is persisted.
    cardLast4: z
      .string()
      .regex(/^\d{4}$/, 'Expected the last four digits of the card')
      .optional(),
    shippingMethod: z.enum(['standard', 'express']).optional().default('standard'),
    promoCode: z.string().trim().max(40).nullable().optional(),
    acceptedTerms: z.literal(true, {
      message: 'You must accept the terms before placing an order',
    }),
  })
  .refine((value) => value.paymentMethod !== 'card' || Boolean(value.cardLast4), {
    message: 'Card details are required for card payments',
    path: ['cardLast4'],
  })
  .refine(
    (value) => value.billingSameAsShipping || Boolean(value.billingAddress),
    { message: 'Provide a billing address or reuse the shipping address', path: ['billingAddress'] },
  )

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  status: z
    .enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .optional(),
})
