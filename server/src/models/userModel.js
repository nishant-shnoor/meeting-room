import pool from '../config/db.js'

const columns = 'id, name, email, password_hash, role, is_active'

const toUser = (row) =>
  row && {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
    passwordHash: row.password_hash,
  }

export const toPublicUser = ({ id, name, email, role }) => ({ id, name, email, role })

export async function findUserByEmail(email) {
  const { rows } = await pool.query(`select ${columns} from users where email = $1`, [email])
  return toUser(rows[0])
}

export async function createUser({ name, email, passwordHash, role = 'employee' }) {
  const { rows } = await pool.query(
    `insert into users (name, email, password_hash, role) values ($1, $2, $3, $4) returning ${columns}`,
    [name, email, passwordHash, role],
  )
  return toUser(rows[0])
}
