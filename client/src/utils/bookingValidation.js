import { DAY_NAMES } from './constants'
import { combineDateTime, minutesBetween, timeToMinutes } from './dateTime'

export function validateBooking(
  { date, startTime, endTime, purpose },
  { hours, restrictions },
) {
  const errors = {}
  if (!date) {
    errors.date = 'Pick a date'
  }

  if (!startTime) {
    errors.startTime = 'Pick a start time'
  }

  if (!endTime) {
    errors.endTime = 'Pick an end time'
  }

  if (purpose.length > 255) {
    errors.purpose = 'Purpose can have at most 255 characters'
  }

  if (errors.date || errors.startTime || errors.endTime) {
    return errors
  }

  const start = combineDateTime(date, startTime)
  const end = combineDateTime(date, endTime)
  const duration = minutesBetween(start, end)

  if (duration <= 0) {
    errors.endTime = 'End time must be after start time'

    return errors
  }

  if (start < new Date()) {
    errors.startTime = 'Start time is in the past'
  }

  const dayHours = hours.find((row) => row.dayOfWeek === start.getDay())

  if (!dayHours?.isOpen) {
    errors.date = `Closed on ${DAY_NAMES[start.getDay()]}`
  } else {
    if (timeToMinutes(startTime) < timeToMinutes(dayHours.openTime)) {
      errors.startTime = `Opens at ${dayHours.openTime}`
    }

    if (timeToMinutes(endTime) > timeToMinutes(dayHours.closeTime)) {
      errors.endTime = `Closes at ${dayHours.closeTime}`
    }
  }

  const {
    minDurationMinutes,
    maxDurationMinutes,
    maxAdvanceDays,
    slotStepMinutes,
  } = restrictions

  if (duration < minDurationMinutes) {
    errors.endTime =
      errors.endTime || `Minimum booking is ${minDurationMinutes} minutes`
  }

  if (duration > maxDurationMinutes) {
    errors.endTime =
      errors.endTime || `Maximum booking is ${maxDurationMinutes} minutes`
  }

  if (timeToMinutes(startTime) % slotStepMinutes) {
    errors.startTime = errors.startTime || `Use ${slotStepMinutes} minute steps`
  }

  if (timeToMinutes(endTime) % slotStepMinutes) {
    errors.endTime = errors.endTime || `Use ${slotStepMinutes} minute steps`
  }

  const lastBookableDay = new Date()
  lastBookableDay.setDate(lastBookableDay.getDate() + maxAdvanceDays)

  if (start > lastBookableDay) {
    errors.date =
      errors.date || `Bookings open up to ${maxAdvanceDays} days ahead`
  }

  return errors
}
