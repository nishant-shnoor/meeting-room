import { z } from 'zod'

const email = z
  .string('Email is required')
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address'))

export const registerSchema = z.object({
  name: z
    .string('Full name is required')
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name can have at most 100 characters'),
  email,
  password: z
    .string('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password can have at most 72 characters'),
})

export const loginSchema = z.object({
  email,
  password: z.string('Password is required').min(1, 'Password is required'),
})
