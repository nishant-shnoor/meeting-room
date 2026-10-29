import { CURRENT_USER, db } from './mockData'
import { copy, mockError, wait } from './mockApi'
import { findOverlap } from '../utils/booking'

const withoutPrivateDetails = (booking) =>
  booking.userId === CURRENT_USER.id ? booking : { ...booking, purpose: null }

const findBooking = (id) => {
  const booking = db.bookings.find((item) => item.id === id)

  if (!booking) {
    throw mockError('Booking not found')
  }

  return booking
}

const assertEditable = (booking) => {
  if (booking.status !== 'confirmed') {
    throw mockError('Only confirmed bookings can be changed')
  }

  if (new Date(booking.startTime) <= new Date()) {
    throw mockError('Bookings that have already started cannot be changed')
  }
}

const assertNoOverlap = (resourceId, startTime, endTime, ignoreId) => {
  const sameResource = db.bookings.filter(
    (item) => item.resourceId === resourceId,
  )

  if (
    findOverlap(sameResource, new Date(startTime), new Date(endTime), ignoreId)
  ) {
    throw mockError(
      'This time overlaps an existing booking. Please pick another slot.',
    )
  }
}

const bookingService = {
  listMine: () =>
    wait(
      copy(
        db.bookings
          .filter((item) => item.userId === CURRENT_USER.id)
          .sort((a, b) => new Date(b.startTime) - new Date(a.startTime)),
      ),
    ),

  listInRange: ({ from, to, resourceId }) => {
    const rangeStart = new Date(from)
    const rangeEnd = new Date(to)

    const matching = db.bookings.filter(
      (item) =>
        item.status === 'confirmed' &&
        new Date(item.startTime) < rangeEnd &&
        new Date(item.endTime) > rangeStart &&
        (!resourceId || item.resourceId === resourceId),
    )

    return wait(copy(matching.map(withoutPrivateDetails)))
  },

  get: (id) => wait(copy(findBooking(id))),

  create: ({ resourceId, startTime, endTime, purpose }) => {
    const resource = db.resources.find((item) => item.id === resourceId)

    if (!resource) {
      return Promise.reject(mockError('Resource not found'))
    }

    try {
      assertNoOverlap(resourceId, startTime, endTime)
    } catch (error) {
      return Promise.reject(error)
    }

    db.nextBookingNumber += 1

    const booking = {
      id: `booking-${db.nextBookingNumber}`,
      resourceId,
      resourceName: resource.name,
      userId: CURRENT_USER.id,
      userName: CURRENT_USER.name,
      startTime,
      endTime,
      purpose: purpose || null,
      status: 'confirmed',
    }

    db.bookings.push(booking)

    return wait(copy(booking))
  },

  update: (id, { startTime, endTime, purpose }) => {
    try {
      const booking = findBooking(id)

      assertEditable(booking)
      assertNoOverlap(booking.resourceId, startTime, endTime, id)

      Object.assign(booking, { startTime, endTime, purpose: purpose || null })

      return wait(copy(booking))
    } catch (error) {
      return Promise.reject(error)
    }
  },

  cancel: (id) => {
    try {
      const booking = findBooking(id)

      assertEditable(booking)
      booking.status = 'cancelled'

      return wait(copy(booking))
    } catch (error) {
      return Promise.reject(error)
    }
  },
}

export default bookingService
