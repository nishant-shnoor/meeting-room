import pool from '../config/db.js'
import env from '../config/env.js'

const baseSelect = `
  select b.id, b.resource_id, r.name as resource_name, b.user_id, u.name as user_name, u.email as user_email,
         b.start_time, b.end_time, b.purpose, b.status, b.created_at,
         r.is_active as resource_active
  from bookings b
  join resources r on r.id = b.resource_id
  join users u on u.id = b.user_id`

const escapeLike = (text) => text.replace(/[\\%_]/g, '\\$&')

function getStatus(row) {
  const finished = new Date(row.end_time) < new Date()

  if (row.status === 'confirmed' && finished) {
    return 'completed'
  }

  return row.status
}

export function toBooking(row, viewer) {
  const canSeeDetails = viewer.role === 'admin' || viewer.id === row.user_id

  return {
    id: row.id,
    resourceId: row.resource_id,
    resourceName: row.resource_name,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: canSeeDetails ? row.user_email : null,
    startTime: row.start_time,
    endTime: row.end_time,
    purpose: canSeeDetails ? row.purpose : null,
    status: getStatus(row),
    resourceActive: row.resource_active,
    createdAt: row.created_at,
  }
}

export async function findBookingRow(id, db = pool, { lock = false } = {}) {
  const { rows } = await db.query(
    `${baseSelect} where b.id = $1 ${lock ? 'for update of b' : ''}`,
    [id],
  )

  return rows[0] ?? null
}

export async function listUserBookings(userId) {
  const { rows } = await pool.query(
    `${baseSelect} where b.user_id = $1 order by b.start_time desc`,
    [userId],
  )

  return rows
}

export async function listBookingsInRange({ from, to, resourceId }) {
  const params = [from, to]
  let resourceFilter = ''

  if (resourceId) {
    params.push(resourceId)
    resourceFilter = `and b.resource_id = $${params.length}`
  }

  const { rows } = await pool.query(
    `${baseSelect}
     where b.status = 'confirmed' and b.start_time < $2 and b.end_time > $1 ${resourceFilter}
     order by b.start_time`,
    params,
  )

  return rows
}

export async function searchBookings({
  date,
  resourceId,
  status,
  search,
  needsAttention,
}) {
  const conditions = []
  const params = []

  if (date) {
    params.push(env.timezone, date)
    conditions.push(
      `(b.start_time at time zone $${params.length - 1})::date = $${params.length}::date`,
    )
  }

  if (resourceId) {
    params.push(resourceId)
    conditions.push(`b.resource_id = $${params.length}`)
  }

  if (status === 'cancelled') {
    conditions.push(`b.status = 'cancelled'`)
  }

  if (status === 'confirmed') {
    conditions.push(`b.status = 'confirmed' and b.end_time >= now()`)
  }

  if (status === 'completed') {
    conditions.push(`b.status = 'confirmed' and b.end_time < now()`)
  }

  if (needsAttention === 'true') {
    conditions.push(
      `b.status = 'confirmed' and b.start_time > now() and not r.is_active`,
    )
  }

  if (search) {
    params.push(`%${escapeLike(search)}%`)
    conditions.push(
      `(u.name ilike $${params.length} or u.email ilike $${params.length})`,
    )
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : ''
  const { rows } = await pool.query(
    `${baseSelect} ${where} order by b.start_time desc limit 500`,
    params,
  )

  return rows
}

export async function insertBooking(
  { resourceId, userId, startTime, endTime, purpose },
  db,
) {
  const { rows } = await db.query(
    `insert into bookings (resource_id, user_id, start_time, end_time, purpose)
     values ($1, $2, $3, $4, $5) returning id`,
    [resourceId, userId, startTime, endTime, purpose],
  )

  return rows[0].id
}

export async function updateBookingTimes(
  id,
  { startTime, endTime, purpose },
  db,
) {
  await db.query(
    'update bookings set start_time = $2, end_time = $3, purpose = $4 where id = $1',
    [id, startTime, endTime, purpose],
  )
}

export async function markCancelled(id, cancelledBy, db) {
  await db.query(
    `update bookings set status = 'cancelled', cancelled_by = $2 where id = $1`,
    [id, cancelledBy],
  )
}

export async function addHistory(
  { bookingId, changedBy, action, details },
  db,
) {
  await db.query(
    'insert into booking_history (booking_id, changed_by, action, details) values ($1, $2, $3, $4)',
    [bookingId, changedBy, action, details],
  )
}

export async function countUpcomingBookings(resourceId) {
  const { rows } = await pool.query(
    `select count(*)::int as total from bookings
     where resource_id = $1 and status = 'confirmed' and start_time > now()`,
    [resourceId],
  )

  return rows[0].total
}

export async function listHistory(bookingId) {
  const { rows } = await pool.query(
    `select h.id, h.action, h.details, h.created_at, u.name as changed_by
     from booking_history h
     join users u on u.id = h.changed_by
     where h.booking_id = $1
     order by h.created_at, h.id`,
    [bookingId],
  )

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    details: row.details,
    changedBy: row.changed_by,
    createdAt: row.created_at,
  }))
}
