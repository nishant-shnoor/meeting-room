import { listBookingsInRange } from '../models/bookingModel.js'
import { getHoursForDay, getRestrictions } from '../models/resourceModel.js'
import { localTimeToDate, timeToMinutes, toLocalParts } from '../utils/time.js'

const overlaps = (busy, start, end) =>
  busy.some((entry) => entry.start < end && entry.end > start)

export async function getAvailability(resourceId, dateKey) {
  const dayStart = localTimeToDate(dateKey, 0)
  const dayEnd = localTimeToDate(dateKey, 24 * 60)
  const dayOfWeek = toLocalParts(dayStart).dayOfWeek

  const hours = await getHoursForDay(resourceId, dayOfWeek)
  const { slotStepMinutes } = await getRestrictions(resourceId)

  const rows = await listBookingsInRange({
    from: dayStart,
    to: dayEnd,
    resourceId,
  })

  const busy = rows.map((row) => ({
    bookingId: row.id,
    start: new Date(row.start_time),
    end: new Date(row.end_time),
  }))

  const freeSlots = []
  const isOpen = Boolean(hours?.isOpen)

  if (isOpen) {
    const opensAt = timeToMinutes(hours.openTime)
    const closesAt = timeToMinutes(hours.closeTime)
    const now = new Date()

    for (
      let minutes = opensAt;
      minutes + slotStepMinutes <= closesAt;
      minutes += slotStepMinutes
    ) {
      const start = localTimeToDate(dateKey, minutes)
      const end = localTimeToDate(dateKey, minutes + slotStepMinutes)

      if (start > now && !overlaps(busy, start, end)) {
        freeSlots.push({
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        })
      }
    }
  }

  return {
    date: dateKey,
    isOpen,
    openTime: isOpen ? hours.openTime : null,
    closeTime: isOpen ? hours.closeTime : null,
    slotStepMinutes,
    busy: busy.map((entry) => ({
      bookingId: entry.bookingId,
      startTime: entry.start.toISOString(),
      endTime: entry.end.toISOString(),
    })),
    freeSlots,
  }
}
