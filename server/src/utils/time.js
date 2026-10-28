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

function offsetAt(date) {
  const parts = toLocalParts(date)
  const [year, month, day] = parts.dateKey.split('-').map(Number)
  const localMs = Date.UTC(year, month - 1, day) + parts.minutes * 60000
  const wholeMinuteMs = Math.floor(date.getTime() / 60000) * 60000

  return localMs - wholeMinuteMs
}

export function localTimeToDate(dateKey, minutes) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const wanted = Date.UTC(year, month - 1, day) + minutes * 60000
  const firstGuess = new Date(wanted - offsetAt(new Date(wanted)))

  return new Date(wanted - offsetAt(firstGuess))
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
