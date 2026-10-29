import { DEFAULT_RESTRICTIONS } from '../utils/constants'
import { addDays, startOfDay } from '../utils/dateTime'

export const CURRENT_USER = { id: 'user-me', name: 'You' }

const weekHours = (openTime, closeTime, saturdayClose = closeTime) =>
  Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    isOpen: dayOfWeek !== 0,
    openTime,
    closeTime: dayOfWeek === 6 ? saturdayClose : closeTime,
  }))

const resources = [
  {
    id: 'res-boardroom',
    name: 'Boardroom',
    type: 'room',
    capacity: 12,
    facilities: 'Projector, Whiteboard, Video conferencing',
    description: 'Large room on the 3rd floor for client meetings.',
    isActive: true,
  },
  {
    id: 'res-brainstorm',
    name: 'Brainstorm Room',
    type: 'room',
    capacity: 6,
    facilities: 'Whiteboard, TV screen',
    description: 'Small room for team discussions.',
    isActive: true,
  },
  {
    id: 'res-huddle',
    name: 'Huddle Room A',
    type: 'room',
    capacity: 4,
    facilities: 'TV screen',
    description: 'Quick catch-ups and calls.',
    isActive: true,
  },
  {
    id: 'res-training',
    name: 'Training Hall',
    type: 'room',
    capacity: 30,
    facilities: 'Projector, Microphone, Sound system',
    description: 'Workshops and training sessions.',
    isActive: true,
  },
  {
    id: 'res-projector',
    name: 'Portable Projector',
    type: 'equipment',
    capacity: null,
    facilities: 'HDMI cable, Remote',
    description: 'Can be used in any room.',
    isActive: true,
  },
  {
    id: 'res-speakerphone',
    name: 'Conference Speakerphone',
    type: 'equipment',
    capacity: null,
    facilities: 'Bluetooth, USB',
    description: 'For calls in rooms without audio setup.',
    isActive: true,
  },
]

const hoursByResource = {
  'res-boardroom': weekHours('09:00', '18:00', '13:00'),
  'res-brainstorm': weekHours('09:00', '18:00', '13:00'),
  'res-huddle': weekHours('09:00', '18:00', '13:00'),
  'res-training': weekHours('09:00', '17:00', '13:00'),
  'res-projector': weekHours('09:00', '18:00'),
  'res-speakerphone': weekHours('09:00', '18:00'),
}

const restrictionsByResource = {
  'res-boardroom': { ...DEFAULT_RESTRICTIONS },
  'res-brainstorm': { ...DEFAULT_RESTRICTIONS },
  'res-huddle': { ...DEFAULT_RESTRICTIONS, maxDurationMinutes: 120 },
  'res-training': { ...DEFAULT_RESTRICTIONS, maxDurationMinutes: 480 },
  'res-projector': { ...DEFAULT_RESTRICTIONS },
  'res-speakerphone': { ...DEFAULT_RESTRICTIONS },
}

const nextWorkingDay = (offset) => {
  let day = addDays(startOfDay(new Date()), offset)

  while (day.getDay() === 0) {
    day = addDays(day, 1)
  }

  return day
}

const at = (day, time) => {
  const [hours, minutes] = time.split(':').map(Number)

  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    hours,
    minutes,
  ).toISOString()
}

const createSeedBookings = () => {
  const tomorrow = nextWorkingDay(1)
  const dayAfter = nextWorkingDay(2)
  const nextWeek = nextWorkingDay(6)
  const lastWeek = addDays(startOfDay(new Date()), -3)
  const today = startOfDay(new Date())

  const entries = [
    [
      'res-boardroom',
      CURRENT_USER,
      today,
      '09:00',
      '10:00',
      'Daily standup',
      'confirmed',
    ],
    [
      'res-brainstorm',
      { id: 'user-asha', name: 'Asha Verma' },
      today,
      '11:00',
      '12:30',
      'Design review',
      'confirmed',
    ],
    [
      'res-boardroom',
      CURRENT_USER,
      tomorrow,
      '10:00',
      '11:30',
      'Client demo',
      'confirmed',
    ],
    [
      'res-training',
      { id: 'user-ravi', name: 'Ravi Singh' },
      tomorrow,
      '09:30',
      '12:30',
      'New joiner training',
      'confirmed',
    ],
    [
      'res-projector',
      CURRENT_USER,
      dayAfter,
      '15:00',
      '16:00',
      'Sprint review',
      'confirmed',
    ],
    [
      'res-huddle',
      { id: 'user-asha', name: 'Asha Verma' },
      dayAfter,
      '09:30',
      '10:30',
      'One on one',
      'confirmed',
    ],
    [
      'res-brainstorm',
      CURRENT_USER,
      nextWeek,
      '12:00',
      '13:00',
      'Planning session',
      'confirmed',
    ],
    [
      'res-boardroom',
      CURRENT_USER,
      lastWeek,
      '10:00',
      '11:00',
      'Quarterly review',
      'confirmed',
    ],
    [
      'res-huddle',
      CURRENT_USER,
      lastWeek,
      '15:00',
      '15:30',
      'Quick sync',
      'cancelled',
    ],
  ]

  return entries.map(
    ([resourceId, user, day, from, to, purpose, status], index) => ({
      id: `booking-${index + 1}`,
      resourceId,
      resourceName: resources.find((item) => item.id === resourceId).name,
      userId: user.id,
      userName: user.name,
      startTime: at(day, from),
      endTime: at(day, to),
      purpose,
      status,
    }),
  )
}

export const db = {
  resources,
  hoursByResource,
  restrictionsByResource,
  bookings: createSeedBookings(),
  nextBookingNumber: 100,
}
