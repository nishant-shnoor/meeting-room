import { readFile } from 'node:fs/promises'
import pool from '../src/config/db.js'

const schema = await readFile(
  new URL('../database/schema.sql', import.meta.url),
  'utf8',
)

try {
  await pool.query(schema)
  console.log('Database tables are ready')
} catch (error) {
  console.error('Database setup failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
