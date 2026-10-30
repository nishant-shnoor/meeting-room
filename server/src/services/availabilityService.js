import { listBusyForResources } from '../models/bookingModel.js'
import {
  findResource,
  findResourcesByIds,
  getHoursForDay,
  getRestrictions,
} from '../models/resourceModel.js'
import { DAY_NAMES } from '../utils/constants.js'
import env from '../config/env.js'
import { notFound } from '../utils/httpError.js'
import {
  addDays,
  dayOfWeekFor,
  formatMinutes,
  minutesOnDay,
  shiftDateKey,
  timeToMinutes,
  toLocalParts,
  zonedTimeToUtc,
} from '../utils/time.js'

const describeBusy = (row, user) => {
  const canSeeDetails = user.role === 'admin' || user.id === row.user_id
  return {
    id: row.parent_booking_id ?? row.id,
    startMinutes: minutesOnDay(new Date(row.start_time), row.dateKey),
    endMinutes:
      minutesOnDay(new Date(row.end_time), row.dateKey, { isEnd: true }) ||
      1440,
    userName: row.user_name,
    isMine: row.user_id === user.id,
    purpose: canSeeDetails ? row.purpose : null,
  }
}

async function describeDay(resource, date, now) {
  const [dayHours, rules] = await Promise.all([
    getHoursForDay(resource.id, dayOfWeekFor(date)),
    getRestrictions(resource.id),
  ])
  const today = toLocalParts(now).dateKey
  const lastDay = toLocalParts(addDays(now, rules.maxAdvanceDays)).dateKey

  let reason = null

  if (!resource.isActive) {
    reason = 'This resource is not available for booking'
  } else if (resource.builtInRoom) {
    reason = `${resource.name} is built into ${resource.builtInRoom.name} and comes with that room`
  } else if (date < today) {
    reason = 'This date is in the past'
  } else if (date > lastDay) {
    reason = `Bookings open up to ${rules.maxAdvanceDays} days ahead`
  } else if (!dayHours?.isOpen) {
    reason = `Closed on ${DAY_NAMES[dayOfWeekFor(date)]}`
  }

  return {
    rules,
    reason,
    isOpen: Boolean(dayHours?.isOpen),
    openMinutes: dayHours?.isOpen ? timeToMinutes(dayHours.openTime) : 0,
    closeMinutes: dayHours?.isOpen ? timeToMinutes(dayHours.closeTime) : 0,
    latestStart: addDays(now, rules.maxAdvanceDays),
  }
}

function buildGrid(day, date, now) {
  if (day.reason || !day.isOpen) {
    return []
  }

  const { slotStepMinutes } = day.rules
  const grid = []
  for (
    let minutes =
      Math.ceil(day.openMinutes / slotStepMinutes) * slotStepMinutes;
    minutes <= day.closeMinutes;
    minutes += slotStepMinutes
  ) {
    const instant = zonedTimeToUtc(date, minutes)
    grid.push({
      minutes,
      time: formatMinutes(minutes),
      iso: instant.toISOString(),
      startable: instant >= now && instant <= day.latestStart,
    })
  }

  return grid
}

export async function getAvailability(
  user,
  { resourceId, date, addOns: addOnIds, ignoreBookingId },
) {
  const resource = await findResource(resourceId)

  if (!resource) {
    throw notFound('Resource not found')
  }

  const now = new Date()
  const dayStart = zonedTimeToUtc(date, 0)
  const dayEnd = zonedTimeToUtc(shiftDateKey(date, 1), 0)

  const addOnResources = (await findResourcesByIds(addOnIds)).sort(
    (a, b) => addOnIds.indexOf(a.id) - addOnIds.indexOf(b.id),
  )
  const targets = [resource, ...addOnResources]

  const busyRows = await listBusyForResources(
    targets.map((item) => item.id),
    dayStart,
    dayEnd,
    ignoreBookingId,
  )

  const busyFor = (id) =>
    busyRows
      .filter((row) => row.resource_id === id)
      .map((row) => describeBusy({ ...row, dateKey: date }, user))

  const main = await describeDay(resource, date, now)

  const addOns = await Promise.all(
    addOnResources.map(async (item) => {
      const day = await describeDay(item, date, now)
      const unavailable =
        item.type !== 'equipment'
          ? 'Only resources can be added to a booking'
          : item.builtInRoom?.id === resourceId
            ? `${item.name} is already built into this room`
            : day.reason
      return {
        id: item.id,
        name: item.name,
        assetKey: item.assetKey,
        isOpen: day.isOpen,
        openMinutes: day.openMinutes,
        closeMinutes: day.closeMinutes,
        latestStart: day.latestStart.toISOString(),
        unavailableReason: unavailable,
        busy: busyFor(item.id),
      }
    }),
  )

  return {
    date,
    today: toLocalParts(now).dateKey,
    timezone: env.timezone,
    resource: {
      id: resource.id,
      name: resource.name,
      type: resource.type,
      assetKey: resource.assetKey,
    },
    bookable: !main.reason,
    reason: main.reason,
    isOpen: main.isOpen,
    openMinutes: main.openMinutes,
    closeMinutes: main.closeMinutes,
    rules: main.rules,
    grid: buildGrid(main, date, now),
    busy: busyFor(resource.id),
    addOns,
  }
}

const overlaps = (busy, start, end) =>
  busy.some((entry) => entry.start < end && entry.end > start)

export async function getResourceAvailability(resourceId, dateKey) {
  const resource = await findResource(resourceId)
  const ownerId = resource.builtInRoom?.id ?? resourceId
  const dayStart = zonedTimeToUtc(dateKey, 0)
  const dayEnd = zonedTimeToUtc(shiftDateKey(dateKey, 1), 0)

  const [hours, rules, rows] = await Promise.all([
    getHoursForDay(ownerId, dayOfWeekFor(dateKey)),
    getRestrictions(ownerId),
    listBusyForResources([resourceId], dayStart, dayEnd),
  ])

  const busy = rows.map((row) => ({
    bookingId: row.parent_booking_id ?? row.id,
    start: new Date(row.start_time),
    end: new Date(row.end_time),
  }))

  const isOpen = Boolean(hours?.isOpen)
  const freeSlots = []

  if (isOpen) {
    const opensAt = timeToMinutes(hours.openTime)
    const closesAt = timeToMinutes(hours.closeTime)
    const now = new Date()

    for (
      let minutes =
        Math.ceil(opensAt / rules.slotStepMinutes) * rules.slotStepMinutes;
      minutes + rules.slotStepMinutes <= closesAt;
      minutes += rules.slotStepMinutes
    ) {
      const start = zonedTimeToUtc(dateKey, minutes)
      const end = zonedTimeToUtc(dateKey, minutes + rules.slotStepMinutes)

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
    slotStepMinutes: rules.slotStepMinutes,
    busy: busy.map((entry) => ({
      bookingId: entry.bookingId,
      startTime: entry.start.toISOString(),
      endTime: entry.end.toISOString(),
    })),
    freeSlots,
  }
}
