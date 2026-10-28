import app from './app.js'
import pool from './config/db.js'
import env from './config/env.js'

try {
  await pool.query('select 1')
} catch (error) {
  console.error('Could not connect to the database:', error.message)
  process.exit(1)
}

const server = app.listen(env.port, () => {
  console.log(`API running on port ${env.port}`)
})

const shutDown = () => {
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGTERM', shutDown)
process.on('SIGINT', shutDown)
