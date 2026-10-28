import pool from '../config/db.js'
import { trimTime } from '../utils/time.js'

const columns = 'id, name, type, capacity, facilities, description, is_active'

export const defaultRestrictions = {
  minDurationMinutes: 30,
  maxDurationMinutes: 240,
  maxAdvanceDays: 30,
  slotStepMinutes: 30,
}

const toResource = (row) =>
  row && {
    id: row.id,
    name: row.name,
    type: row.type,
    capacity: row.capacity,
    facilities: row.facilities,
    description: row.description,
    isActive: row.is_active,
  }

const toHours = (row) => ({
  dayOfWeek: row.day_of_week,
  isOpen: row.is_open,
  openTime: trimTime(row.open_time),
  closeTime: trimTime(row.close_time),
})

const toRestrictions = (row) => ({
  minDurationMinutes: row.min_duration_minutes,
  maxDurationMinutes: row.max_duration_minutes,
  maxAdvanceDays: row.max_advance_days,
  slotStepMinutes: row.slot_step_minutes,
})

export async function listResources({
  includeInactive = false,
  type,
  minCapacity,
  search,
} = {}) {
  const conditions = []
  const params = []

  if (!includeInactive) {
    conditions.push('is_active')
  }

  if (type) {
    params.push(type)
    conditions.push(`type = $${params.length}`)
  }

  if (minCapacity) {
    params.push(minCapacity)
    conditions.push(`capacity >= $${params.length}`)
  }

  if (search) {
    params.push(`%${search.replace(/[\\%_]/g, '\\$&')}%`)
    conditions.push(
      `(name ilike $${params.length} or facilities ilike $${params.length})`,
    )
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : ''
  const { rows } = await pool.query(
    `select ${columns} from resources ${where} order by lower(name)`,
    params,
  )

  return rows.map(toResource)
}

export async function findResource(id, db = pool) {
  const { rows } = await db.query(
    `select ${columns} from resources where id = $1`,
    [id],
  )

  return toResource(rows[0])
}

export async function createResource(
  { name, type, capacity, facilities, description },
  db = pool,
) {
  const { rows } = await db.query(
    `insert into resources (name, type, capacity, facilities, description)
     values ($1, $2, $3, $4, $5) returning ${columns}`,
    [name, type, capacity, facilities, description],
  )
  const resource = toResource(rows[0])

  await db.query(
    `insert into operating_hours (resource_id, day_of_week, is_open)
     select $1, day, day <> 0 from generate_series(0, 6) as day`,
    [resource.id],
  )
  await db.query('insert into booking_restrictions (resource_id) values ($1)', [
    resource.id,
  ])

  return resource
}

export async function updateResource(
  id,
  { name, type, capacity, facilities, description },
) {
  const { rows } = await pool.query(
    `update resources set name = $2, type = $3, capacity = $4, facilities = $5, description = $6
     where id = $1 returning ${columns}`,
    [id, name, type, capacity, facilities, description],
  )

  return toResource(rows[0])
}

export async function setResourceActive(id, isActive) {
  const { rows } = await pool.query(
    `update resources set is_active = $2 where id = $1 returning ${columns}`,
    [id, isActive],
  )

  return toResource(rows[0])
}

export async function getHours(resourceId, db = pool) {
  const { rows } = await db.query(
    'select day_of_week, is_open, open_time, close_time from operating_hours where resource_id = $1 order by day_of_week',
    [resourceId],
  )

  return rows.map(toHours)
}

export async function getHoursForDay(resourceId, dayOfWeek, db = pool) {
  const { rows } = await db.query(
    'select day_of_week, is_open, open_time, close_time from operating_hours where resource_id = $1 and day_of_week = $2',
    [resourceId, dayOfWeek],
  )

  return rows[0] ? toHours(rows[0]) : null
}

export async function replaceHours(resourceId, days, db = pool) {
  await db.query(
    `insert into operating_hours (resource_id, day_of_week, is_open, open_time, close_time)
     select $1, entry.day, entry.is_open, entry.open_time::time, entry.close_time::time
     from unnest($2::int[], $3::boolean[], $4::text[], $5::text[]) as entry(day, is_open, open_time, close_time)
     on conflict (resource_id, day_of_week) do update
     set is_open = excluded.is_open, open_time = excluded.open_time, close_time = excluded.close_time`,
    [
      resourceId,
      days.map((day) => day.dayOfWeek),
      days.map((day) => day.isOpen),
      days.map((day) => day.openTime),
      days.map((day) => day.closeTime),
    ],
  )
}

export async function getRestrictions(resourceId, db = pool) {
  const { rows } = await db.query(
    `select min_duration_minutes, max_duration_minutes, max_advance_days, slot_step_minutes
     from booking_restrictions where resource_id = $1`,
    [resourceId],
  )

  return rows[0] ? toRestrictions(rows[0]) : { ...defaultRestrictions }
}

export async function saveRestrictions(resourceId, values) {
  await pool.query(
    `insert into booking_restrictions
       (resource_id, min_duration_minutes, max_duration_minutes, max_advance_days, slot_step_minutes)
     values ($1, $2, $3, $4, $5)
     on conflict (resource_id) do update set
       min_duration_minutes = excluded.min_duration_minutes,
       max_duration_minutes = excluded.max_duration_minutes,
       max_advance_days = excluded.max_advance_days,
       slot_step_minutes = excluded.slot_step_minutes`,
    [
      resourceId,
      values.minDurationMinutes,
      values.maxDurationMinutes,
      values.maxAdvanceDays,
      values.slotStepMinutes,
    ],
  )

  return getRestrictions(resourceId)
}
