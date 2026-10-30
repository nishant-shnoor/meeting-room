import { getHoursForDay, getRestrictions } from '../models/resourceModel.js'
import { addDays, timeToMinutes, toLocalParts } from '../utils/time.js'
import { DAY_NAMES } from '../utils/constants.js'
import { invalid } from '../utils/httpError.js'

const fail = (field, message) => invalid(message, { [field]: message })

async function assertInsideHours(
  { resourceId, startTime, endTime },
  db,
  label = '',
) {
  const start = toLocalParts(startTime)
  const end = toLocalParts(endTime)

  if (start.dateKey !== end.dateKey) {
    throw fail('endTime', 'A booking must start and end on the same day')
  }

  const dayHours = await getHoursForDay(resourceId, start.dayOfWeek, db)

  if (!dayHours?.isOpen) {
    throw fail('date', `${label}Closed on ${DAY_NAMES[start.dayOfWeek]}`)
  }

  if (start.minutes < timeToMinutes(dayHours.openTime)) {
    throw fail('startTime', `${label}Opens at ${dayHours.openTime}`)
  }

  if (end.minutes > timeToMinutes(dayHours.closeTime)) {
    throw fail('endTime', `${label}Closes at ${dayHours.closeTime}`)
  }

  return { start, end }
}

export async function assertBookingAllowed(
  { resourceId, startTime, endTime },
  db,
) {
  if (startTime.getTime() % 60000 || endTime.getTime() % 60000) {
    throw fail('startTime', 'Times must be whole minutes')
  }

  if (startTime < new Date()) {
    throw fail('startTime', 'Start time is in the past')
  }

  const { start, end } = await assertInsideHours(
    { resourceId, startTime, endTime },
    db,
  )

  const {
    minDurationMinutes,
    maxDurationMinutes,
    maxAdvanceDays,
    slotStepMinutes,
  } = await getRestrictions(resourceId, db)
  const duration = end.minutes - start.minutes

  if (duration < minDurationMinutes) {
    throw fail('endTime', `Minimum booking is ${minDurationMinutes} minutes`)
  }

  if (duration > maxDurationMinutes) {
    throw fail('endTime', `Maximum booking is ${maxDurationMinutes} minutes`)
  }

  if (start.minutes % slotStepMinutes) {
    throw fail('startTime', `Use ${slotStepMinutes} minute steps`)
  }

  if (end.minutes % slotStepMinutes) {
    throw fail('endTime', `Use ${slotStepMinutes} minute steps`)
  }

  if (startTime > addDays(new Date(), maxAdvanceDays)) {
    throw fail('date', `Bookings open up to ${maxAdvanceDays} days ahead`)
  }
}

export async function assertAddOnAllowed(
  { resourceId, name, startTime, endTime },
  db,
) {
  const label = `${name}: `
  await assertInsideHours({ resourceId, startTime, endTime }, db, label)

  const { maxAdvanceDays } = await getRestrictions(resourceId, db)

  if (startTime > addDays(new Date(), maxAdvanceDays)) {
    throw fail(
      'addOnIds',
      `${label}bookings open up to ${maxAdvanceDays} days ahead`,
    )
  }
}
