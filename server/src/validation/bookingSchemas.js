import { z } from 'zod'
import { shiftDateKey } from '../utils/time.js'

const dateField = (label) =>
  z.coerce.date({ error: `${label} is required and must be a valid date` })

const dateKey = z
  .string('Date is required')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must look like YYYY-MM-DD')
  .refine(
    (value) => shiftDateKey(value, 0) === value,
    'Date is not a real calendar day',
  )

export const bookingSchema = z
  .object({
    resourceId: z.uuid('Choose a valid resource'),
    startTime: dateField('Start time'),
    endTime: dateField('End time'),
    purpose: z
      .string()
      .trim()
      .max(255, 'Purpose can have at most 255 characters')
      .nullish()
      .transform((value) => value || null),
    addOnIds: z
      .array(z.uuid('Choose valid resources'))
      .max(10, 'You can add up to 10 resources')
      .optional(),
  })
  .refine((value) => value.endTime > value.startTime, {
    path: ['endTime'],
    message: 'End time must be after start time',
  })

export const bookingUpdateSchema = z
  .object({
    startTime: dateField('Start time'),
    endTime: dateField('End time'),
    purpose: z
      .string()
      .trim()
      .max(255, 'Purpose can have at most 255 characters')
      .nullish()
      .transform((value) => value || null),
    addOnIds: z
      .array(z.uuid('Choose valid resources'))
      .max(10, 'You can add up to 10 resources')
      .optional(),
  })
  .refine((value) => value.endTime > value.startTime, {
    path: ['endTime'],
    message: 'End time must be after start time',
  })

export const bookingFiltersSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must look like YYYY-MM-DD')
    .optional(),
  resourceId: z.uuid('Choose a valid resource').optional(),
  status: z
    .enum(
      ['confirmed', 'cancelled', 'completed'],
      'Status must be confirmed, cancelled or completed',
    )
    .optional(),
  search: z
    .string()
    .trim()
    .max(100, 'Search can have at most 100 characters')
    .optional(),
  needsAttention: z.enum(['true', 'false']).optional(),
})

const maxRangeDays = 93

export const calendarQuerySchema = z
  .object({
    from: dateField('From'),
    to: dateField('To'),
    resourceId: z.uuid('Choose a valid resource').optional(),
  })
  .refine((value) => value.to > value.from, {
    path: ['to'],
    message: 'To must be after from',
  })
  .refine(
    (value) => value.to - value.from <= maxRangeDays * 24 * 60 * 60 * 1000,
    {
      path: ['to'],
      message: `Date range cannot be longer than ${maxRangeDays} days`,
    },
  )

export const availabilityQuerySchema = z.object({
  resourceId: z.uuid('Choose a valid resource'),
  date: dateKey,
  addOns: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
    )
    .pipe(
      z
        .array(z.uuid('Choose valid resources'))
        .max(50, 'You can check up to 50 resources'),
    ),
  ignoreBookingId: z.uuid('Choose a valid booking').optional(),
})
