import pool from '../config/db.js'
import { trimTime } from '../utils/time.js'

const baseSelect = `
  select r.id, r.name, r.type, r.capacity, r.facilities, r.description, r.is_active, r.asset_key,
    coalesce((
      select json_agg(
        json_build_object('id', x.id, 'name', x.name, 'assetKey', x.asset_key, 'isActive', x.is_active)
        order by lower(x.name)
      )
      from room_resources link
      join resources x on x.id = link.resource_id
      where link.room_id = r.id
    ), '[]'::json) as built_in,
    (
      select json_build_object('id', room.id, 'name', room.name)
      from room_resources link
      join resources room on room.id = link.room_id
      where link.resource_id = r.id
    ) as built_in_room
  from resources r`

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
    assetKey: row.asset_key,
    builtIn: row.built_in ?? [],
    builtInRoom: row.built_in_room ?? null,
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
    conditions.push('r.is_active')
  }

  if (type) {
    params.push(type)
    conditions.push(`r.type = $${params.length}`)
  }

  if (minCapacity) {
    params.push(minCapacity)
    conditions.push(`r.capacity >= $${params.length}`)
  }

  if (search) {
    params.push(`%${search.replace(/[\\%_]/g, '\\$&')}%`)
    conditions.push(
      `(r.name ilike $${params.length} or r.facilities ilike $${params.length})`,
    )
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : ''
  const { rows } = await pool.query(
    `${baseSelect} ${where} order by lower(r.name)`,
    params,
  )
  return rows.map(toResource)
}

export async function findResource(id, db = pool) {
  const { rows } = await db.query(`${baseSelect} where r.id = $1`, [id])
  return toResource(rows[0])
}

export async function findResourcesByIds(ids, db = pool) {
  if (!ids.length) {
    return []
  }

  const { rows } = await db.query(
    `${baseSelect} where r.id = any($1::uuid[])`,
    [ids],
  )
  return rows.map(toResource)
}

export async function replaceBuiltIn(roomId, resourceIds, db = pool) {
  await db.query('delete from room_resources where room_id = $1', [roomId])

  if (!resourceIds.length) {
    return
  }

  await db.query(
    `insert into room_resources (room_id, resource_id)
     select $1, unnest($2::uuid[])`,
    [roomId, resourceIds],
  )
}

export async function createResource(
  {
    name,
    type,
    capacity,
    facilities,
    description,
    assetKey = null,
    builtInResourceIds = [],
  },
  db = pool,
) {
  const { rows } = await db.query(
    `insert into resources (name, type, capacity, facilities, description, asset_key)
     values ($1, $2, $3, $4, $5, $6) returning id`,
    [name, type, capacity, facilities, description, assetKey],
  )
  const id = rows[0].id

  await db.query(
    `insert into operating_hours (resource_id, day_of_week, is_open)
     select $1, day, day <> 0 from generate_series(0, 6) as day`,
    [id],
  )
  await db.query('insert into booking_restrictions (resource_id) values ($1)', [
    id,
  ])

  if (type === 'room' && builtInResourceIds.length) {
    await replaceBuiltIn(id, builtInResourceIds, db)
  }

  return findResource(id, db)
}

export async function updateResource(
  id,
  {
    name,
    type,
    capacity,
    facilities,
    description,
    assetKey = null,
    builtInResourceIds = [],
  },
  db = pool,
) {
  const { rowCount } = await db.query(
    `update resources set name = $2, type = $3, capacity = $4, facilities = $5, description = $6, asset_key = $7
     where id = $1`,
    [id, name, type, capacity, facilities, description, assetKey],
  )

  if (!rowCount) {
    return null
  }

  await replaceBuiltIn(id, type === 'room' ? builtInResourceIds : [], db)
  return findResource(id, db)
}

export async function setResourceActive(id, isActive) {
  const { rowCount } = await pool.query(
    'update resources set is_active = $2 where id = $1',
    [id, isActive],
  )
  return rowCount ? findResource(id) : null
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
