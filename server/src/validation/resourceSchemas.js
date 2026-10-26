import { z } from 'zod'

const emptyToNull = (value) => (value === '' || value === undefined ? null : value)

export const resourceSchema = z
  .object({
    name: z.string('Name is required').trim().min(1, 'Name is required').max(100, 'Name can have at most 100 characters'),
    type: z.enum(['room', 'equipment'], 'Type must be room or equipment'),
    capacity: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() !== '' ? Number(value) : emptyToNull(value)),
      z.number('Capacity must be a number').int('Capacity must be a whole number').positive('Capacity must be above 0').nullable(),
    ),
    facilities: z.string().trim().max(500, 'Facilities can have at most 500 characters').default(''),
    description: z.string().trim().max(1000, 'Description can have at most 1000 characters').default(''),
  })
  .superRefine((value, context) => {
    if (value.type === 'room' && value.capacity === null) {
      context.addIssue({ code: 'custom', path: ['capacity'], message: 'Capacity is required for rooms' })
    }
  })
  .transform((value) => ({ ...value, capacity: value.type === 'room' ? value.capacity : null }))
