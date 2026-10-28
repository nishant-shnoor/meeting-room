import { z } from 'zod'
import { timeToMinutes } from '../utils/time.js'
import { DAY_NAMES } from '../utils/constants.js'

const emptyToNull = (value) =>
  value === '' || value === undefined ? null : value

export const resourceSchema = z
  .object({
    name: z
      .string('Name is required')
      .trim()
      .min(1, 'Name is required')
      .max(100, 'Name can have at most 100 characters'),
    type: z.enum(['room', 'equipment'], 'Type must be room or equipment'),
    capacity: z.preprocess(
      (value) =>
        typeof value === 'string' && value.trim() !== ''
          ? Number(value)
          : emptyToNull(value),
      z
        .number('Capacity must be a number')
        .int('Capacity must be a whole number')
        .positive('Capacity must be above 0')
        .nullable(),
    ),
    facilities: z
      .string()
      .trim()
      .max(500, 'Facilities can have at most 500 characters')
      .default(''),
    description: z
      .string()
      .trim()
      .max(1000, 'Description can have at most 1000 characters')
      .default(''),
  })
  .superRefine((value, context) => {
    if (value.type === 'room' && value.capacity === null) {
      context.addIssue({
        code: 'custom',
        path: ['capacity'],
        message: 'Capacity is required for rooms',
      })
    }
  })
  .transform((value) => ({
    ...value,
    capacity: value.type === 'room' ? value.capacity : null,
  }))

export const statusSchema = z.object({
  isActive: z.boolean('isActive must be true or false'),
})

const timePattern = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/
const timeValue = z.string().regex(timePattern, 'Use the HH:MM time format')

export const hoursSchema = z
  .object({
    hours: z
      .array(
        z.object({
          dayOfWeek: z.number('Day of week is required').int().min(0).max(6),
          isOpen: z.boolean('isOpen must be true or false'),
          openTime: timeValue.optional(),
          closeTime: timeValue.optional(),
        }),
      )
      .length(7, 'Send operating hours for all 7 days'),
  })
  .superRefine(({ hours }, context) => {
    const days = new Set(hours.map((row) => row.dayOfWeek))

    if (days.size !== 7) {
      context.addIssue({
        code: 'custom',
        path: ['hours'],
        message: 'Each day of the week must appear once',
      })

      return
    }

    hours.forEach((row, index) => {
      if (!row.isOpen) {
        return
      }

      if (!row.openTime || !row.closeTime) {
        context.addIssue({
          code: 'custom',
          path: ['hours', index],
          message: `Set opening and closing time for ${DAY_NAMES[row.dayOfWeek]}`,
        })
      } else if (timeToMinutes(row.openTime) >= timeToMinutes(row.closeTime)) {
        context.addIssue({
          code: 'custom',
          path: ['hours', index, 'closeTime'],
          message: `Closing time must be after opening time on ${DAY_NAMES[row.dayOfWeek]}`,
        })
      }
    })
  })
  .transform(({ hours }) => ({
    hours: hours.map((row) => ({
      dayOfWeek: row.dayOfWeek,
      isOpen: row.isOpen,
      openTime: row.isOpen ? row.openTime : (row.openTime ?? '09:00'),
      closeTime: row.isOpen ? row.closeTime : (row.closeTime ?? '18:00'),
    })),
  }))

const wholeNumber = (label) =>
  z.coerce
    .number(`${label} must be a number`)
    .int(`${label} must be a whole number`)
    .positive(`${label} must be above 0`)

export const restrictionsSchema = z
  .object({
    minDurationMinutes: wholeNumber('Minimum length'),
    maxDurationMinutes: wholeNumber('Maximum length').max(
      1440,
      'Maximum length cannot exceed 24 hours',
    ),
    maxAdvanceDays: wholeNumber('Advance days').max(
      365,
      'Advance days cannot exceed 365',
    ),
    slotStepMinutes: wholeNumber('Slot step').max(
      240,
      'Slot step cannot exceed 240 minutes',
    ),
  })
  .superRefine((value, context) => {
    if (value.minDurationMinutes > value.maxDurationMinutes) {
      context.addIssue({
        code: 'custom',
        path: ['maxDurationMinutes'],
        message: 'Maximum cannot be less than minimum',
      })
    }

    if (value.minDurationMinutes % value.slotStepMinutes !== 0) {
      context.addIssue({
        code: 'custom',
        path: ['minDurationMinutes'],
        message: 'Minimum length should fit the slot step',
      })
    }
  })

export const resourceListQuerySchema = z.object({
  includeInactive: z.enum(['true', 'false']).optional(),
  type: z
    .enum(['room', 'equipment'], 'Type must be room or equipment')
    .optional(),
  minCapacity: z.coerce
    .number('Minimum capacity must be a number')
    .int('Minimum capacity must be a whole number')
    .positive('Minimum capacity must be above 0')
    .optional(),
  search: z
    .string()
    .trim()
    .max(100, 'Search can have at most 100 characters')
    .optional(),
})

export const availabilityQuerySchema = z.object({
  date: z
    .string('Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must look like YYYY-MM-DD')
    .refine((value) => {
      const parsed = new Date(`${value}T00:00:00Z`)

      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().startsWith(value)
      )
    }, 'Date is not a real calendar date'),
})
