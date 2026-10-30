import { formatDuration, minutesToTime } from './dateTime'

const range = (start, end) => `${minutesToTime(start)} - ${minutesToTime(end)}`

const findClash = (busy, start, end) =>
  busy.find((item) => item.startMinutes < end && item.endMinutes > start)

export function buildDurations(rules) {
  const durations = []
  for (
    let minutes = rules.minDurationMinutes;
    minutes <= rules.maxDurationMinutes;
    minutes += rules.slotStepMinutes
  ) {
    durations.push(minutes)
  }

  return durations
}

export function pickDefaultDuration(durations, preferred) {
  if (preferred && durations.includes(preferred)) {
    return preferred
  }

  return (
    durations.find((minutes) => minutes >= 60) ??
    durations[durations.length - 1] ??
    30
  )
}

export function addOnProblem(addOn, point, start, end) {
  if (addOn.unavailableReason) {
    return addOn.unavailableReason
  }

  if (!addOn.isOpen) {
    return `${addOn.name} is closed on this day`
  }

  if (start < addOn.openMinutes || end > addOn.closeMinutes) {
    return `${addOn.name} is only available ${range(addOn.openMinutes, addOn.closeMinutes)}`
  }

  if (point && new Date(point.iso) > new Date(addOn.latestStart)) {
    return `${addOn.name} cannot be booked this far ahead`
  }

  const clash = findClash(addOn.busy, start, end)

  if (clash) {
    return `${addOn.name} is booked ${range(clash.startMinutes, clash.endMinutes)}`
  }

  return null
}

export function createSlotChecker(data, selectedAddOns) {
  const points = new Map(data.grid.map((point) => [point.minutes, point]))

  const check = (start, duration) => {
    const end = start + duration

    if (!data.bookable) {
      return { ok: false, reason: data.reason }
    }

    const point = points.get(start)

    if (!point) {
      return {
        ok: false,
        reason:
          start < data.openMinutes
            ? `Opens at ${minutesToTime(data.openMinutes)}`
            : 'Outside opening hours',
      }
    }

    if (!point.startable) {
      return {
        ok: false,
        reason:
          data.date === data.today
            ? 'That time has already passed'
            : 'Too far ahead to book',
      }
    }

    if (end > data.closeMinutes) {
      return {
        ok: false,
        reason: `Closes at ${minutesToTime(data.closeMinutes)}`,
      }
    }

    const clash = findClash(data.busy, start, end)

    if (clash) {
      const who = clash.isMine ? 'You have' : `${clash.userName} has`
      return {
        ok: false,
        reason: `${who} it ${range(clash.startMinutes, clash.endMinutes)}`,
      }
    }

    for (const addOn of selectedAddOns) {
      const problem = addOnProblem(addOn, point, start, end)

      if (problem) {
        return { ok: false, reason: problem }
      }
    }

    return { ok: true, point, endPoint: points.get(end) }
  }

  return { check, points }
}

export function suggestShorterDuration(checker, data, durations, current) {
  return [...durations]
    .filter((minutes) => minutes < current)
    .reverse()
    .find((minutes) =>
      data.grid.some((point) => checker.check(point.minutes, minutes).ok),
    )
}

export const describeSlot = (start, duration) =>
  `${range(start, start + duration)} (${formatDuration(duration)})`

export const partOfDay = (minutes) =>
  minutes < 720 ? 'Morning' : minutes < 1020 ? 'Afternoon' : 'Evening'
