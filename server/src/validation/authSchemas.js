import { z } from 'zod'

const email = z
  .string('Email is required')
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address'))

const name = z
  .string('Full name is required')
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name can have at most 100 characters')

const password = z
  .string('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password can have at most 72 characters')

const optionalText = (label, max) =>
  z
    .string()
    .trim()
    .max(max, `${label} can have at most ${max} characters`)
    .nullish()
    .transform((value) => value ?? '')

const phone = z
  .string()
  .trim()
  .max(30, 'Phone can have at most 30 characters')
  .regex(
    /^[0-9+()\-\s.]*$/,
    'Phone can only contain digits, spaces and + - ( )',
  )
  .nullish()
  .transform((value) => value ?? '')

export const registerSchema = z.object({ name, email, password })

export const loginSchema = z.object({
  email,
  password: z.string('Password is required').min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({ email })

export const profileSchema = z.object({
  name,
  email,
  phone,
  department: optionalText('Department', 100),
  jobTitle: optionalText('Job title', 100),
})

export const passwordChangeSchema = z.object({
  currentPassword: z
    .string('Current password is required')
    .min(1, 'Current password is required'),
  newPassword: password,
})

export const userCreateSchema = z.object({
  name,
  email,
  password,
  role: z
    .enum(['employee', 'admin'], 'Role must be employee or admin')
    .default('employee'),
  phone,
  department: optionalText('Department', 100),
  jobTitle: optionalText('Job title', 100),
})

export const userUpdateSchema = z.object({
  name,
  email,
  role: z.enum(['employee', 'admin'], 'Role must be employee or admin'),
  phone,
  department: optionalText('Department', 100),
  jobTitle: optionalText('Job title', 100),
})

export const userStatusSchema = z.object({
  isActive: z.boolean('isActive must be true or false'),
})

export const adminPasswordSchema = z.object({ password })

export const userListQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, 'Search can have at most 100 characters')
    .optional(),
  role: z
    .enum(['employee', 'admin'], 'Role must be employee or admin')
    .optional(),
  status: z
    .enum(['active', 'inactive'], 'Status must be active or inactive')
    .optional(),
})
