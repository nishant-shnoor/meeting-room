import { findOverlap } from './booking'
import { combineDateTime, minutesToTime, timeToMinutes } from './dateTime'

export function getFreeSlots(date, hours, restrictions, bookings) {
  const day = combineDateTime(date, '00:00').getDay()
  const dayHours = hours.find((row) => row.dayOfWeek === day)

  if (!dayHours?.isOpen) {
    return []
  }

  const { slotStepMinutes, minDurationMinutes } = restrictions
  const slotLength = Math.max(slotStepMinutes, minDurationMinutes)
  const closesAt = timeToMinutes(dayHours.closeTime)
  const now = new Date()
  const slots = []

  for (
    let minutes = timeToMinutes(dayHours.openTime);
    minutes + slotLength <= closesAt;
    minutes += slotLength
  ) {
    const startTime = minutesToTime(minutes)
    const endTime = minutesToTime(minutes + slotLength)
    const start = combineDateTime(date, startTime)
    const end = combineDateTime(date, endTime)

    if (start > now && !findOverlap(bookings, start, end)) {
      slots.push({ startTime, endTime })
    }
  }

  return slots
}
