import { z } from 'zod'

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be 72 characters or fewer')
  .regex(/[a-z]/, 'Include at least one lowercase letter')
  .regex(/[A-Z]/, 'Include at least one uppercase letter')
  .regex(/\d/, 'Include at least one number')

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name').max(80),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  password,
  newsletterOptIn: z.boolean().optional().default(false),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  password: z.string().min(1, 'Please enter your password'),
})

export const addressSchema = z.object({
  label: z.string().trim().max(40).optional().default('Home'),
  fullName: z.string().trim().min(2).max(80),
  line1: z.string().trim().min(3).max(160),
  line2: z.string().trim().max(160).optional().default(''),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(3).max(16),
  country: z.string().trim().max(80).optional().default('United States'),
  phone: z.string().trim().max(32).optional().default(''),
  isDefault: z.boolean().optional().default(false),
})
