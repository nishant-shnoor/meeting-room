import pool from '../config/db.js'
import env from '../config/env.js'
import { minutesOnDay, toLocalParts } from '../utils/time.js'

const baseSelect = `
  select b.id, b.resource_id, r.name as resource_name, r.type as resource_type, r.asset_key as resource_asset_key,
         b.user_id, u.name as user_name, u.email as user_email,
         b.start_time, b.end_time, b.purpose, b.status, b.created_at, b.parent_booking_id,
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

export function toBooking(row, viewer, addOns = []) {
  const canSeeDetails = viewer.role === 'admin' || viewer.id === row.user_id
  const start = new Date(row.start_time)
  const { dateKey } = toLocalParts(start)

  return {
    id: row.id,
    resourceId: row.resource_id,
    resourceName: row.resource_name,
    resourceType: row.resource_type,
    resourceAssetKey: row.resource_asset_key,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: canSeeDetails ? row.user_email : null,
    startTime: row.start_time,
    endTime: row.end_time,
    businessDate: dateKey,
    startMinutes: minutesOnDay(start, dateKey),
    endMinutes:
      minutesOnDay(new Date(row.end_time), dateKey, { isEnd: true }) || 1440,
    purpose: canSeeDetails ? row.purpose : null,
    status: getStatus(row),
    resourceActive: row.resource_active,
    createdAt: row.created_at,
    parentBookingId: row.parent_booking_id,
    addOns,
  }
}

export async function listAddOnsFor(parentIds, db = pool) {
  const grouped = new Map()

  if (!parentIds.length) {
    return grouped
  }

  const { rows } = await db.query(
    `select c.parent_booking_id, c.resource_id, r.name, r.asset_key
     from bookings c
     join resources r on r.id = c.resource_id
     where c.parent_booking_id = any($1::uuid[])
     order by lower(r.name)`,
    [parentIds],
  )

  rows.forEach((row) => {
    const list = grouped.get(row.parent_booking_id) ?? []
    list.push({
      resourceId: row.resource_id,
      name: row.name,
      assetKey: row.asset_key,
    })
    grouped.set(row.parent_booking_id, list)
  })
  return grouped
}

export async function listBuiltInByRoom(roomIds, db = pool) {
  const grouped = new Map()

  if (!roomIds.length) {
    return grouped
  }

  const { rows } = await db.query(
    `select rr.room_id, r.id, r.name, r.type, r.asset_key
     from room_resources rr
     join resources r on r.id = rr.resource_id
     where rr.room_id = any($1::uuid[]) and r.is_active
     order by lower(r.name)`,
    [roomIds],
  )

  rows.forEach((row) => {
    const list = grouped.get(row.room_id) ?? []
    list.push(row)
    grouped.set(row.room_id, list)
  })
  return grouped
}

export async function presentBookings(rows, viewer, db = pool) {
  const addOns = await listAddOnsFor(
    rows.filter((row) => !row.parent_booking_id).map((row) => row.id),
    db,
  )
  return rows.map((row) => toBooking(row, viewer, addOns.get(row.id) ?? []))
}

export async function presentCalendar(rows, viewer) {
  const bookings = await presentBookings(rows, viewer)
  const builtIns = await listBuiltInByRoom([
    ...new Set(
      rows
        .filter((row) => row.resource_type === 'room')
        .map((row) => row.resource_id),
    ),
  ])
  return bookings.map((booking) => ({
    ...booking,
    builtIn: (builtIns.get(booking.resourceId) ?? []).map((item) => ({
      resourceId: item.id,
      name: item.name,
      assetKey: item.asset_key,
    })),
  }))
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
    `${baseSelect} where b.user_id = $1 and b.parent_booking_id is null order by b.start_time desc`,
    [userId],
  )
  return rows
}

export async function listBookingsInRange({ from, to, resourceId }) {
  const params = [from, to]
  let resourceFilter = ''

  if (resourceId) {
    params.push(resourceId)
    resourceFilter = `and (
      b.resource_id = $${params.length}
      or exists (select 1 from room_resources rr where rr.room_id = b.resource_id and rr.resource_id = $${params.length})
      or exists (select 1 from bookings c where c.parent_booking_id = b.id and c.status = 'confirmed' and c.resource_id = $${params.length})
    )`
  }

  const { rows } = await pool.query(
    `${baseSelect}
     where b.status = 'confirmed' and b.parent_booking_id is null and b.start_time < $2 and b.end_time > $1 ${resourceFilter}
     order by b.start_time`,
    params,
  )
  return rows
}

export async function listBusyForResources(
  resourceIds,
  from,
  to,
  ignoreBookingId,
) {
  const { rows } = await pool.query(
    `${baseSelect}
     where b.status = 'confirmed' and b.resource_id = any($1::uuid[]) and b.start_time < $3 and b.end_time > $2
       and ($4::uuid is null or (b.id <> $4 and (b.parent_booking_id is null or b.parent_booking_id <> $4)))
     order by b.start_time`,
    [resourceIds, from, to, ignoreBookingId ?? null],
  )
  return rows
}

export async function listChildBookings(parentId, db) {
  const { rows } = await db.query(
    `select c.id, c.resource_id, r.name as resource_name
     from bookings c join resources r on r.id = c.resource_id
     where c.parent_booking_id = $1 for update of c`,
    [parentId],
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
  const conditions = ['b.parent_booking_id is null']
  const params = []

  if (date) {
    params.push(env.timezone, date)
    conditions.push(
      `(b.start_time at time zone $${params.length - 1})::date = $${params.length}::date`,
    )
  }

  if (resourceId) {
    params.push(resourceId)
    conditions.push(
      `(b.resource_id = $${params.length} or exists (select 1 from bookings c where c.parent_booking_id = b.id and c.resource_id = $${params.length}))`,
    )
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

  const { rows } = await pool.query(
    `${baseSelect} where ${conditions.join(' and ')} order by b.start_time desc limit 500`,
    params,
  )
  return rows
}

export async function insertBooking(
  { resourceId, userId, startTime, endTime, purpose, parentBookingId = null },
  db,
) {
  const { rows } = await db.query(
    `insert into bookings (resource_id, user_id, start_time, end_time, purpose, parent_booking_id)
     values ($1, $2, $3, $4, $5, $6) returning id`,
    [resourceId, userId, startTime, endTime, purpose, parentBookingId],
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

export async function deleteBooking(id, db) {
  await db.query('delete from bookings where id = $1', [id])
}

export async function markCancelled(id, cancelledBy, db) {
  await db.query(
    `update bookings set status = 'cancelled', cancelled_by = $2
     where id = $1 or (parent_booking_id = $1 and status = 'confirmed')`,
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
