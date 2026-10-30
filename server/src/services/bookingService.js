import { inTransaction } from '../config/db.js'
import {
  addHistory,
  deleteBooking,
  findBookingRow,
  insertBooking,
  listChildBookings,
  markCancelled,
  presentBookings,
  updateBookingTimes,
} from '../models/bookingModel.js'
import { findResource, findResourcesByIds } from '../models/resourceModel.js'
import { conflict, forbidden, invalid, notFound } from '../utils/httpError.js'
import { assertAddOnAllowed, assertBookingAllowed } from './bookingRules.js'

const overlapMessage =
  'This time overlaps an existing booking. Please pick another slot.'

const describeSlot = (startTime, endTime) =>
  `${new Date(startTime).toISOString()} to ${new Date(endTime).toISOString()}`

async function withOverlapGuard(work, message = overlapMessage) {
  try {
    return await work()
  } catch (error) {
    if (error.code === '23P01') {
      throw conflict(message)
    }

    throw error
  }
}

const addOnOverlapMessage = (name) =>
  `${name} is already booked for that time. Pick another time or remove it from this booking.`

async function loadEditableBooking(id, user, db) {
  const row = await findBookingRow(id, db, { lock: true })

  if (!row) {
    throw notFound('Booking not found')
  }

  if (row.parent_booking_id) {
    throw conflict(
      'This resource belongs to a room booking. Change or cancel the room booking instead.',
    )
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

async function loadAddOns(room, ids, db) {
  if (!ids.length) {
    return []
  }

  if (new Set(ids).size !== ids.length) {
    throw invalid('Each resource can be added once', {
      addOnIds: 'Each resource can be added once',
    })
  }

  if (room.type !== 'room') {
    throw invalid('Extra resources can only be added to a room booking', {
      addOnIds: 'Only rooms can include extra resources',
    })
  }

  const found = await findResourcesByIds(ids, db)
  const byId = new Map(found.map((item) => [item.id, item]))

  return ids.map((id) => {
    const item = byId.get(id)

    if (!item) {
      throw notFound('One of the selected resources no longer exists')
    }

    if (item.type !== 'equipment') {
      throw invalid(`${item.name} is a room and cannot be added`, {
        addOnIds: 'Choose resources only',
      })
    }

    if (!item.isActive) {
      throw conflict(`${item.name} is not available for booking`)
    }

    if (item.builtInRoom?.id === room.id) {
      throw conflict(`${item.name} is already built into ${room.name}`)
    }

    if (item.builtInRoom) {
      throw conflict(
        `${item.name} is built into ${item.builtInRoom.name} and cannot be added`,
      )
    }

    return item
  })
}

async function present(id, user, db) {
  const [booking] = await presentBookings(
    [await findBookingRow(id, db)],
    user,
    db,
  )
  return booking
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

    if (resource.builtInRoom) {
      throw conflict(
        `${resource.name} is built into ${resource.builtInRoom.name} and comes with that room`,
      )
    }

    const addOns = await loadAddOns(resource, input.addOnIds ?? [], db)

    await assertBookingAllowed(input, db)
    for (const addOn of addOns) {
      await assertAddOnAllowed(
        {
          resourceId: addOn.id,
          name: addOn.name,
          startTime: input.startTime,
          endTime: input.endTime,
        },
        db,
      )
    }

    const id = await withOverlapGuard(() =>
      insertBooking({ ...input, userId: user.id }, db),
    )

    for (const addOn of addOns) {
      await withOverlapGuard(
        () =>
          insertBooking(
            {
              ...input,
              resourceId: addOn.id,
              userId: user.id,
              parentBookingId: id,
            },
            db,
          ),
        addOnOverlapMessage(addOn.name),
      )
    }

    const extras = addOns.length
      ? ` with ${addOns.map((addOn) => addOn.name).join(', ')}`
      : ''
    await addHistory(
      {
        bookingId: id,
        changedBy: user.id,
        action: 'created',
        details: `Booked ${describeSlot(input.startTime, input.endTime)}${extras}`,
      },
      db,
    )
    return present(id, user, db)
  })
}

export function updateBooking(user, id, input) {
  return inTransaction(async (db) => {
    const current = await loadEditableBooking(id, user, db)
    const resource = await findResource(current.resource_id, db)

    if (!resource.isActive) {
      throw conflict('This resource is not available for booking')
    }

    const children = await listChildBookings(id, db)
    const wantedIds =
      input.addOnIds ?? children.map((child) => child.resource_id)
    const addOns = await loadAddOns(resource, wantedIds, db)

    await assertBookingAllowed(
      { ...input, resourceId: current.resource_id },
      db,
    )
    for (const addOn of addOns) {
      await assertAddOnAllowed(
        {
          resourceId: addOn.id,
          name: addOn.name,
          startTime: input.startTime,
          endTime: input.endTime,
        },
        db,
      )
    }

    await withOverlapGuard(() => updateBookingTimes(id, input, db))

    const wanted = new Set(addOns.map((addOn) => addOn.id))
    for (const child of children.filter(
      (item) => !wanted.has(item.resource_id),
    )) {
      await deleteBooking(child.id, db)
    }

    const kept = new Map(
      children
        .filter((item) => wanted.has(item.resource_id))
        .map((item) => [item.resource_id, item]),
    )
    for (const addOn of addOns) {
      const existing = kept.get(addOn.id)
      await withOverlapGuard(
        () =>
          existing
            ? updateBookingTimes(existing.id, input, db)
            : insertBooking(
                {
                  ...input,
                  resourceId: addOn.id,
                  userId: current.user_id,
                  parentBookingId: id,
                },
                db,
              ),
        addOnOverlapMessage(addOn.name),
      )
    }

    await addHistory(
      {
        bookingId: id,
        changedBy: user.id,
        action: 'edited',
        details: `Moved from ${describeSlot(current.start_time, current.end_time)} to ${describeSlot(input.startTime, input.endTime)}`,
      },
      db,
    )
    return present(id, user, db)
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
    return present(id, user, db)
  })
}
