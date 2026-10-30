import pool from '../config/db.js'

const columns =
  'id, name, email, password_hash, role, is_active, phone, department, job_title, created_at'

const toUser = (row) =>
  row && {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
    phone: row.phone,
    department: row.department,
    jobTitle: row.job_title,
    createdAt: row.created_at,
    passwordHash: row.password_hash,
  }

export const toPublicUser = ({
  id,
  name,
  email,
  role,
  phone,
  department,
  jobTitle,
}) => ({
  id,
  name,
  email,
  role,
  phone,
  department,
  jobTitle,
})

export const toManagedUser = (user, extra = {}) => ({
  ...toPublicUser(user),
  isActive: user.isActive,
  createdAt: user.createdAt,
  ...extra,
})

const escapeLike = (text) => text.replace(/[\\%_]/g, '\\$&')

export async function findUserById(id) {
  const { rows } = await pool.query(
    `select ${columns} from users where id = $1`,
    [id],
  )
  return toUser(rows[0])
}

export async function findUserByEmail(email) {
  const { rows } = await pool.query(
    `select ${columns} from users where email = $1`,
    [email],
  )
  return toUser(rows[0])
}

export async function createUser({
  name,
  email,
  passwordHash,
  role = 'employee',
  phone = '',
  department = '',
  jobTitle = '',
}) {
  const { rows } = await pool.query(
    `insert into users (name, email, password_hash, role, phone, department, job_title)
     values ($1, $2, $3, $4, $5, $6, $7) returning ${columns}`,
    [name, email, passwordHash, role, phone, department, jobTitle],
  )
  return toUser(rows[0])
}

export async function updateUserDetails(
  id,
  { name, email, phone, department, jobTitle },
) {
  const { rows } = await pool.query(
    `update users set name = $2, email = $3, phone = $4, department = $5, job_title = $6
     where id = $1 returning ${columns}`,
    [id, name, email, phone, department, jobTitle],
  )
  return toUser(rows[0])
}

export async function updateUserRole(id, role) {
  const { rows } = await pool.query(
    `update users set role = $2 where id = $1 returning ${columns}`,
    [id, role],
  )
  return toUser(rows[0])
}

export async function setUserActive(id, isActive) {
  const { rows } = await pool.query(
    `update users set is_active = $2 where id = $1 returning ${columns}`,
    [id, isActive],
  )
  return toUser(rows[0])
}

export async function setUserPassword(id, passwordHash) {
  await pool.query('update users set password_hash = $2 where id = $1', [
    id,
    passwordHash,
  ])
}

export async function countOtherActiveAdmins(excludeId) {
  const { rows } = await pool.query(
    `select count(*)::int as total from users where role = 'admin' and is_active and id <> $1`,
    [excludeId],
  )
  return rows[0].total
}

export async function listUsers({ search, role, status } = {}) {
  const conditions = []
  const params = []

  if (search) {
    params.push(`%${escapeLike(search)}%`)
    conditions.push(
      `(u.name ilike $${params.length} or u.email ilike $${params.length} or u.department ilike $${params.length} or u.job_title ilike $${params.length})`,
    )
  }

  if (role) {
    params.push(role)
    conditions.push(`u.role = $${params.length}`)
  }

  if (status === 'active') {
    conditions.push('u.is_active')
  }

  if (status === 'inactive') {
    conditions.push('not u.is_active')
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : ''
  const { rows } = await pool.query(
    `select u.id, u.name, u.email, u.password_hash, u.role, u.is_active, u.phone, u.department, u.job_title, u.created_at,
            (select count(*)::int from bookings b
              where b.user_id = u.id and b.parent_booking_id is null and b.status = 'confirmed' and b.end_time >= now()) as upcoming_bookings
     from users u ${where}
     order by u.is_active desc, lower(u.name)
     limit 500`,
    params,
  )
  return rows.map((row) => ({
    user: toUser(row),
    upcomingBookings: row.upcoming_bookings,
  }))
}

export async function createResetRequest(userId) {
  await pool.query(
    'insert into password_reset_requests (user_id) values ($1) on conflict do nothing',
    [userId],
  )
}

export async function listResetRequests() {
  const { rows } = await pool.query(
    `select p.id, p.created_at, u.id as user_id, u.name, u.email, u.is_active
     from password_reset_requests p
     join users u on u.id = p.user_id
     where p.resolved_at is null
     order by p.created_at`,
  )
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    isActive: row.is_active,
  }))
}

export async function resolveResetRequestsForUser(userId) {
  await pool.query(
    'update password_reset_requests set resolved_at = now() where user_id = $1 and resolved_at is null',
    [userId],
  )
}

export async function dismissResetRequest(id) {
  const { rowCount } = await pool.query(
    'update password_reset_requests set resolved_at = now() where id = $1 and resolved_at is null',
    [id],
  )
  return rowCount > 0
}
