export const TOKEN_KEY = 'roombook_token'

export const ROLES = {
  employee: 'employee',
  admin: 'admin',
}

export const BOOKING_STATUS = {
  confirmed: 'confirmed',
  cancelled: 'cancelled',
  completed: 'completed',
}

export const RESOURCE_TYPES = [
  { value: 'room', label: 'Room' },
  { value: 'equipment', label: 'Equipment' },
]

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

export const CALENDAR_START_HOUR = 8
export const CALENDAR_END_HOUR = 20
export const HOUR_HEIGHT = 56

export const DEFAULT_RESTRICTIONS = {
  minDurationMinutes: 30,
  maxDurationMinutes: 240,
  maxAdvanceDays: 30,
  slotStepMinutes: 30,
}
