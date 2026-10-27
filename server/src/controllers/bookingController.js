import {
  findBookingRow,
  listBookingsInRange,
  listUserBookings,
  searchBookings,
  toBooking,
} from '../models/bookingModel.js'
import * as bookingService from '../services/bookingService.js'
import { forbidden, notFound } from '../utils/httpError.js'

export async function listMine(req, res) {
  const rows = await listUserBookings(req.user.id)
  res.json(rows.map((row) => toBooking(row, req.user)))
}

export async function listAll(req, res) {
  const rows = await searchBookings(req.validated.query)
  res.json(rows.map((row) => toBooking(row, req.user)))
}

export async function listCalendar(req, res) {
  const rows = await listBookingsInRange(req.validated.query)
  res.json(rows.map((row) => toBooking(row, req.user)))
}

export async function getOne(req, res) {
  const row = await findBookingRow(req.params.id)
  if (!row) throw notFound('Booking not found')
  if (row.user_id !== req.user.id && req.user.role !== 'admin') throw forbidden('You can only view your own bookings')
  res.json(toBooking(row, req.user))
}

export async function create(req, res) {
  res.status(201).json(await bookingService.createBooking(req.user, req.validated.body))
}

export async function edit(req, res) {
  res.json(await bookingService.editBooking(req.user, req.params.id, req.validated.body))
}

export async function cancel(req, res) {
  res.json(await bookingService.cancelBooking(req.user, req.params.id))
}
