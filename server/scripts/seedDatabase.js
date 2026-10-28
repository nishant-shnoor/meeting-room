import bcrypt from 'bcryptjs'
import pool, { inTransaction } from '../src/config/db.js'
import { createResource } from '../src/models/resourceModel.js'

const adminAccount = {
  name: process.env.ADMIN_NAME || 'Office Admin',
  email: (process.env.ADMIN_EMAIL || 'admin@roombook.com').toLowerCase(),
  password: process.env.ADMIN_PASSWORD || 'Admin@12345',
  role: 'admin',
}

const employeeAccount = {
  name: 'Demo Employee',
  email: 'employee@roombook.com',
  password: 'Employee@12345',
  role: 'employee',
}

const sampleResources = [
  {
    name: 'Boardroom',
    type: 'room',
    capacity: 12,
    facilities: 'Projector, Whiteboard, Video conferencing',
    description: 'Large room on the 3rd floor for client meetings.',
  },
  {
    name: 'Brainstorm Room',
    type: 'room',
    capacity: 6,
    facilities: 'Whiteboard, TV screen',
    description: 'Small room for team discussions.',
  },
  {
    name: 'Huddle Room A',
    type: 'room',
    capacity: 4,
    facilities: 'TV screen',
    description: 'Quick catch-ups and calls.',
  },
  {
    name: 'Training Hall',
    type: 'room',
    capacity: 30,
    facilities: 'Projector, Microphone, Sound system',
    description: 'Workshops and training sessions.',
  },
  {
    name: 'Portable Projector',
    type: 'equipment',
    capacity: null,
    facilities: 'HDMI cable, Remote',
    description: 'Can be used in any room.',
  },
  {
    name: 'Conference Speakerphone',
    type: 'equipment',
    capacity: null,
    facilities: 'Bluetooth, USB',
    description: 'For calls in rooms without audio setup.',
  },
]

async function saveUser({ name, email, password, role }) {
  await pool.query(
    `insert into users (name, email, password_hash, role) values ($1, $2, $3, $4)
     on conflict (email) do nothing`,
    [name, email, await bcrypt.hash(password, 10), role],
  )
}

async function saveResource(resource) {
  const { rowCount } = await pool.query(
    'select 1 from resources where lower(name) = lower($1)',
    [resource.name],
  )

  if (rowCount) {
    return
  }

  await inTransaction((db) => createResource(resource, db))
}

try {
  await saveUser(adminAccount)
  await saveUser(employeeAccount)

  for (const resource of sampleResources) await saveResource(resource)
  console.log(`Seed finished. Admin login: ${adminAccount.email}`)
} catch (error) {
  console.error('Seeding failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
