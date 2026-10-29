import { BOOKING_STATUS } from './constants'
import { formatTimeRange } from './dateTime'

export function getDisplayStatus(booking) {
  if (booking.status === BOOKING_STATUS.cancelled) {
    return BOOKING_STATUS.cancelled
  }

  if (new Date(booking.endTime) < new Date()) {
    return BOOKING_STATUS.completed
  }

  return BOOKING_STATUS.confirmed
}

export function canModifyBooking(booking) {
  return (
    booking.status === BOOKING_STATUS.confirmed &&
    new Date(booking.startTime) > new Date()
  )
}

export function findOverlap(bookings, start, end, ignoreId) {
  return bookings.find(
    (booking) =>
      booking.id !== ignoreId &&
      booking.status === BOOKING_STATUS.confirmed &&
      new Date(booking.startTime) < end &&
      new Date(booking.endTime) > start,
  )
}

export function describeOverlap(booking) {
  return `This time overlaps an existing booking (${formatTimeRange(booking.startTime, booking.endTime)}). Please pick another slot.`
}

export function groupByLane(bookings) {
  const sorted = [...bookings].sort(
    (a, b) => new Date(a.startTime) - new Date(b.startTime),
  )
  const placed = []
  let cluster = []
  let clusterEnd = 0

  const closeCluster = () => {
    const laneCount = Math.max(1, ...cluster.map((item) => item.lane + 1))
    cluster.forEach((item) => placed.push({ ...item, laneCount }))
    cluster = []
  }

  sorted.forEach((booking) => {
    const start = new Date(booking.startTime).getTime()
    const end = new Date(booking.endTime).getTime()

    if (cluster.length && start >= clusterEnd) {
      closeCluster()
    }

    const laneEnds = []
    cluster.forEach((item) => {
      laneEnds[item.lane] = Math.max(
        laneEnds[item.lane] ?? 0,
        new Date(item.booking.endTime).getTime(),
      )
    })
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start)

    if (lane === -1) {
      lane = laneEnds.length
    }

    cluster.push({ booking, lane })
    clusterEnd = Math.max(clusterEnd, end)
  })

  if (cluster.length) {
    closeCluster()
  }

  return placed
}
