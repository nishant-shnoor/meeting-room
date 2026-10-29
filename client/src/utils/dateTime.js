const pad = (value) => String(value).padStart(2, '0')

export const toDateValue = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const toTimeValue = (date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`

export const now = () => new Date()

export const todayValue = () => toDateValue(new Date())

export const combineDateTime = (dateValue, timeValue) =>
  new Date(`${dateValue}T${timeValue}:00`)

export const timeToMinutes = (timeValue) => {
  const [hours, minutes] = timeValue.split(':').map(Number)

  return hours * 60 + minutes
}

export const minutesToTime = (totalMinutes) =>
  `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`

export const minutesBetween = (from, to) => Math.round((to - from) / 60000)

export const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

export const addDays = (date, days) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)

export const addMonths = (date, months) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1)

export const startOfWeek = (date) =>
  addDays(startOfDay(date), -((date.getDay() + 6) % 7))

export const isSameDay = (first, second) =>
  toDateValue(first) === toDateValue(second)

export const getMonthGrid = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
  const gridStart = startOfWeek(firstDay)
  const daysInMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate()
  const weeks = Math.ceil((((firstDay.getDay() + 6) % 7) + daysInMonth) / 7)

  return Array.from({ length: weeks * 7 }, (_, index) =>
    addDays(gridStart, index),
  )
}

export const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

export const formatLongDate = (value) =>
  new Date(value).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

export const formatMonth = (value) =>
  new Date(value).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })

export const formatTime = (value) => toTimeValue(new Date(value))

export const formatTimeRange = (start, end) =>
  `${formatTime(start)} - ${formatTime(end)}`

export const formatHour = (hour) => `${pad(hour)}:00`
