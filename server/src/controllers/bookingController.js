import {
  findBookingRow,
  listHistory,
  listBookingsInRange,
  listUserBookings,
  presentBookings,
  presentCalendar,
  searchBookings,
  toBooking,
} from '../models/bookingModel.js'
import * as bookingService from '../services/bookingService.js'
import { forbidden, notFound } from '../utils/httpError.js'

export async function listMine(req, res) {
  res.json(await presentBookings(await listUserBookings(req.user.id), req.user))
}

export async function listAll(req, res) {
  res.json(
    await presentBookings(await searchBookings(req.validated.query), req.user),
  )
}

export async function listCalendar(req, res) {
  res.json(
    await presentCalendar(
      await listBookingsInRange(req.validated.query),
      req.user,
    ),
  )
}

export async function getOne(req, res) {
  const row = await findBookingRow(req.params.id)

  if (!row) {
    throw notFound('Booking not found')
  }

  if (row.user_id !== req.user.id && req.user.role !== 'admin') {
    throw forbidden('You can only view your own bookings')
  }

  const [booking] = await presentBookings([row], req.user)
  res.json(booking)
}

export async function history(req, res) {
  const row = await findBookingRow(req.params.id)

  if (!row) {
    throw notFound('Booking not found')
  }

  if (row.user_id !== req.user.id && req.user.role !== 'admin') {
    throw forbidden('You can only view your own bookings')
  }

  res.json(await listHistory(row.id))
}

export async function create(req, res) {
  res
    .status(201)
    .json(await bookingService.createBooking(req.user, req.validated.body))
}

export async function update(req, res) {
  res.json(
    await bookingService.updateBooking(
      req.user,
      req.params.id,
      req.validated.body,
    ),
  )
}

export async function cancel(req, res) {
  res.json(await bookingService.cancelBooking(req.user, req.params.id))
}
