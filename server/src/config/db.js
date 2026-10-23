import pg from 'pg'
import env from './env.js'

const isLocalDatabase = /@(localhost|127\.0\.0\.1)[:/]/.test(env.databaseUrl)

const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: isLocalDatabase ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
})

pool.on('error', (error) => {
  console.error('Database connection error:', error.message)
})

export async function inTransaction(work) {
  const client = await pool.connect()
  try {
    await client.query('begin')
    const result = await work(client)
    await client.query('commit')
    return result
  } catch (error) {
    await client.query('rollback').catch(() => {})
    throw error
  } finally {
    client.release()
  }
}

export default pool
