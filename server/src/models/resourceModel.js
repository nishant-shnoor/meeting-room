import pool from '../config/db.js'

const columns = 'id, name, type, capacity, facilities, description, is_active'

const toResource = (row) => ({
  id: row.id,
  name: row.name,
  type: row.type,
  capacity: row.capacity,
  facilities: row.facilities,
  description: row.description,
  isActive: row.is_active,
})

export async function listResources() {
  const { rows } = await pool.query(`select ${columns} from resources order by lower(name)`)
  return rows.map(toResource)
}

export async function createResource({ name, type, capacity, facilities, description }) {
  const { rows } = await pool.query(
    `insert into resources (name, type, capacity, facilities, description)
     values ($1, $2, $3, $4, $5) returning ${columns}`,
    [name, type, capacity, facilities, description],
  )
  return toResource(rows[0])
}

export async function findResource(id, db = pool) {
  const { rows } = await db.query(`select ${columns} from resources where id = $1`, [id])
  return rows[0] ? toResource(rows[0]) : null
}
