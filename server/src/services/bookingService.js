import { inTransaction } from '../config/db.js'
import {
  addHistory,
  findBookingRow,
  insertBooking,
  markCancelled,
  toBooking,
  updateBookingTimes,
} from '../models/bookingModel.js'
import { findResource } from '../models/resourceModel.js'
import { conflict, forbidden, notFound } from '../utils/httpError.js'
import { assertBookingAllowed } from './bookingRules.js'

const overlapMessage =
  'This time overlaps an existing booking. Please pick another slot.'

const describeSlot = (startTime, endTime) =>
  `${new Date(startTime).toISOString()} to ${new Date(endTime).toISOString()}`

async function withOverlapGuard(work) {
  try {
    return await work()
  } catch (error) {
    if (error.code === '23P01') {
      throw conflict(overlapMessage)
    }

    throw error
  }
}

async function loadEditableBooking(id, user, db) {
  const row = await findBookingRow(id, db, { lock: true })

  if (!row) {
    throw notFound('Booking not found')
  }

  if (row.user_id !== user.id && user.role !== 'admin') {
    throw forbidden('You can only change your own bookings')
  }

  if (row.status !== 'confirmed') {
    throw conflict('Only confirmed bookings can be changed')
  }

  if (new Date(row.start_time) <= new Date()) {
    throw conflict('Bookings that have already started cannot be changed')
  }

  return row
}

export function createBooking(user, input) {
  return inTransaction(async (db) => {
    const resource = await findResource(input.resourceId, db)

    if (!resource) {
      throw notFound('Resource not found')
    }

    if (!resource.isActive) {
      throw conflict('This resource is not available for booking')
    }

    await assertBookingAllowed(input, db)

    const id = await withOverlapGuard(() =>
      insertBooking({ ...input, userId: user.id }, db),
    )
    await addHistory(
      {
        bookingId: id,
        changedBy: user.id,
        action: 'created',
        details: `Booked ${describeSlot(input.startTime, input.endTime)}`,
      },
      db,
    )

    return toBooking(await findBookingRow(id, db), user)
  })
}

export function updateBooking(user, id, input) {
  return inTransaction(async (db) => {
    const current = await loadEditableBooking(id, user, db)
    const resource = await findResource(current.resource_id, db)

    if (!resource.isActive) {
      throw conflict('This resource is not available for booking')
    }

    await assertBookingAllowed(
      { ...input, resourceId: current.resource_id },
      db,
    )

    await withOverlapGuard(() => updateBookingTimes(id, input, db))
    await addHistory(
      {
        bookingId: id,
        changedBy: user.id,
        action: 'edited',
        details: `Moved from ${describeSlot(current.start_time, current.end_time)} to ${describeSlot(input.startTime, input.endTime)}`,
      },
      db,
    )

    return toBooking(await findBookingRow(id, db), user)
  })
}

export function cancelBooking(user, id) {
  return inTransaction(async (db) => {
    const current = await loadEditableBooking(id, user, db)

    await markCancelled(id, user.id, db)
    await addHistory(
      {
        bookingId: id,
        changedBy: user.id,
        action: 'cancelled',
        details: `Cancelled booking for ${describeSlot(current.start_time, current.end_time)}`,
      },
      db,
    )

    return toBooking(await findBookingRow(id, db), user)
  })
}
