import env from '../config/env.js'

const weekdayIndex = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

const localFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: env.timezone,
  hourCycle: 'h23',
  weekday: 'short',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

export function toLocalParts(date) {
  const parts = Object.fromEntries(
    localFormatter.formatToParts(date).map(({ type, value }) => [type, value]),
  )
  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    dayOfWeek: weekdayIndex[parts.weekday],
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  }
}

export function timeToMinutes(value) {
  const [hours, minutes] = value.split(':')
  return Number(hours) * 60 + Number(minutes)
}

export function trimTime(value) {
  return value.slice(0, 5)
}

export function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

const pad = (value) => String(value).padStart(2, '0')

const keyToUtcMillis = (dateKey, minutes = 0) => {
  const [year, month, day] = dateKey.split('-').map(Number)
  return Date.UTC(year, month - 1, day, 0, minutes)
}

export function dayOfWeekFor(dateKey) {
  return new Date(keyToUtcMillis(dateKey)).getUTCDay()
}

export function shiftDateKey(dateKey, days) {
  const moved = new Date(keyToUtcMillis(dateKey) + days * 24 * 60 * 60 * 1000)
  return `${moved.getUTCFullYear()}-${pad(moved.getUTCMonth() + 1)}-${pad(moved.getUTCDate())}`
}

export function zonedTimeToUtc(dateKey, minutes) {
  const wanted = keyToUtcMillis(dateKey, minutes)
  let guess = wanted

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const local = toLocalParts(new Date(guess))
    const shown = keyToUtcMillis(local.dateKey, local.minutes)

    if (shown === wanted) {
      break
    }

    guess += wanted - shown
  }

  return new Date(guess)
}

export function minutesOnDay(instant, dateKey, { isEnd = false } = {}) {
  const local = toLocalParts(instant)

  if (local.dateKey < dateKey) {
    return 0
  }

  if (local.dateKey > dateKey) {
    return 1440
  }

  if (isEnd && local.minutes === 0) {
    return 0
  }

  return local.minutes
}

export function formatMinutes(total) {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}
