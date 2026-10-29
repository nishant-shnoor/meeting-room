import { DEFAULT_RESTRICTIONS } from './constants'

const trimTime = (value) => (value ? value.slice(0, 5) : '')

export function normalizeHours(rows = []) {
  return Array.from({ length: 7 }, (_, dayOfWeek) => {
    const row = rows.find((item) => item.dayOfWeek === dayOfWeek)

    if (row) {
      return {
        dayOfWeek,
        isOpen: row.isOpen,
        openTime: trimTime(row.openTime),
        closeTime: trimTime(row.closeTime),
      }
    }

    return {
      dayOfWeek,
      isOpen: dayOfWeek !== 0,
      openTime: '09:00',
      closeTime: '18:00',
    }
  })
}

export function normalizeRestrictions(values) {
  return { ...DEFAULT_RESTRICTIONS, ...values }
}
