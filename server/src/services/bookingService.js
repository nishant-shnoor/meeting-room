import { inTransaction } from '../config/db.js'
import { findBookingRow, insertBooking, markCancelled, toBooking, updateBooking } from '../models/bookingModel.js'
import { findResource } from '../models/resourceModel.js'
import { MAX_ADVANCE_DAYS, MAX_BOOKING_MINUTES, MIN_BOOKING_MINUTES } from '../utils/constants.js'
import { conflict, forbidden, invalid, notFound } from '../utils/httpError.js'

const fail = (field, message) => invalid(message, { [field]: message })

function assertSlotAllowed({ startTime, endTime }) {
  const now = new Date()
  const minutes = (endTime - startTime) / 60000

  if (startTime < now) throw fail('startTime', 'Start time is in the past')
  if (minutes < MIN_BOOKING_MINUTES) throw fail('endTime', `Minimum booking is ${MIN_BOOKING_MINUTES} minutes`)
  if (minutes > MAX_BOOKING_MINUTES) throw fail('endTime', `Maximum booking is ${MAX_BOOKING_MINUTES / 60} hours`)
  if (startTime - now > MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000) {
    throw fail('startTime', `Bookings open up to ${MAX_ADVANCE_DAYS} days ahead`)
  }
}

async function loadEditableBooking(id, user, db) {
  const row = await findBookingRow(id, db, { lock: true })
  if (!row) throw notFound('Booking not found')
  if (row.user_id !== user.id && user.role !== 'admin') throw forbidden('You can only change your own bookings')
  if (row.status !== 'confirmed') throw conflict('Only confirmed bookings can be changed')
  if (new Date(row.start_time) <= new Date()) throw conflict('Bookings that have already started cannot be changed')
  return row
}

export function createBooking(user, input) {
  return inTransaction(async (db) => {
    const resource = await findResource(input.resourceId, db)
    if (!resource) throw notFound('Resource not found')
    if (!resource.isActive) throw conflict('This resource is not available for booking')

    assertSlotAllowed(input)

    const id = await insertBooking({ ...input, userId: user.id }, db)
    return toBooking(await findBookingRow(id, db), user)
  })
}

export function editBooking(user, id, input) {
  return inTransaction(async (db) => {
    await loadEditableBooking(id, user, db)

    assertSlotAllowed(input)

    await updateBooking(id, input, db)
    return toBooking(await findBookingRow(id, db), user)
  })
}

export function cancelBooking(user, id) {
  return inTransaction(async (db) => {
    await loadEditableBooking(id, user, db)

    await markCancelled(id, user.id, db)
    return toBooking(await findBookingRow(id, db), user)
  })
}
