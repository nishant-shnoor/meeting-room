import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'

process.env.NODE_ENV = 'test'

const { default: app } = await import('../src/app.js')
const { default: pool } = await import('../src/config/db.js')

const runId = Date.now().toString(36)
const password = 'Passw0rd!'

let baseUrl
let server
let admin
let ana
let ravi
let resource

const call = async (method, path, { token, body } = {}) => {
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()

  return { status: response.status, body: text ? JSON.parse(text) : null }
}

const nextWeekday = (weekday, minimumDaysAway = 3) => {
  const day = new Date(Date.now() + minimumDaysAway * 86400000)

  while (day.getUTCDay() !== weekday) day.setUTCDate(day.getUTCDate() + 1)

  return day.toISOString().slice(0, 10)
}

const slot = (date, from, to) => ({
  startTime: new Date(`${date}T${from}:00+05:30`).toISOString(),
  endTime: new Date(`${date}T${to}:00+05:30`).toISOString(),
})

const signUp = async (label) => {
  const { body } = await call('POST', '/auth/register', {
    body: {
      name: `Test ${label}`,
      email: `${label}.${runId}@example.com`,
      password,
    },
  })

  return body
}

before(async () => {
  server = app.listen(0)
  baseUrl = `http://localhost:${server.address().port}`

  ana = await signUp('ana')
  ravi = await signUp('ravi')
  const boss = await signUp('boss')
  await pool.query(`update users set role = 'admin' where id = $1`, [
    boss.user.id,
  ])
  admin = (
    await call('POST', '/auth/login', {
      body: { email: `boss.${runId}@example.com`, password },
    })
  ).body

  const created = await call('POST', '/resources', {
    token: admin.token,
    body: {
      name: `Test Room ${runId}`,
      type: 'room',
      capacity: 8,
      facilities: 'TV',
      description: '',
    },
  })
  resource = created.body
})

after(async () => {
  await pool.query('delete from resources where id = $1', [resource.id])
  await pool.query(`delete from users where email like $1`, [
    `%.${runId}@example.com`,
  ])
  await pool.end()
  server.close()
})

describe('auth', () => {
  test('register rejects bad input', async () => {
    const { status, body } = await call('POST', '/auth/register', {
      body: { name: 'A', email: 'nope', password: 'short' },
    })
    assert.equal(status, 422)
    assert.ok(body.errors.name && body.errors.email && body.errors.password)
  })

  test('register rejects a duplicate email', async () => {
    const { status } = await call('POST', '/auth/register', {
      body: { name: 'Test ana', email: `ana.${runId}@example.com`, password },
    })
    assert.equal(status, 409)
  })

  test('login works and wrong password fails', async () => {
    const good = await call('POST', '/auth/login', {
      body: { email: `ANA.${runId}@example.com`, password },
    })
    assert.equal(good.status, 200)
    assert.equal(good.body.user.role, 'employee')
    assert.equal(good.body.user.passwordHash, undefined)

    const bad = await call('POST', '/auth/login', {
      body: { email: `ana.${runId}@example.com`, password: 'wrong-password' },
    })
    assert.equal(bad.status, 401)
  })

  test('protected routes need a valid token', async () => {
    assert.equal((await call('GET', '/auth/me')).status, 401)
    assert.equal(
      (await call('GET', '/auth/me', { token: 'garbage' })).status,
      401,
    )
    assert.equal(
      (await call('GET', '/auth/me', { token: ana.token })).body.email,
      `ana.${runId}@example.com`,
    )
  })
})

describe('resources', () => {
  test('employees cannot manage resources', async () => {
    const attempt = await call('POST', '/resources', {
      token: ana.token,
      body: { name: 'X', type: 'equipment' },
    })
    assert.equal(attempt.status, 403)
  })

  test('rooms need a capacity and names stay unique', async () => {
    const noCapacity = await call('POST', '/resources', {
      token: admin.token,
      body: { name: 'No Cap', type: 'room' },
    })
    assert.equal(noCapacity.status, 422)

    const duplicate = await call('POST', '/resources', {
      token: admin.token,
      body: { name: resource.name.toUpperCase(), type: 'room', capacity: 4 },
    })
    assert.equal(duplicate.status, 409)
  })

  test('a new resource starts with weekly hours and default restrictions', async () => {
    const hours = await call('GET', `/resources/${resource.id}/hours`, {
      token: ana.token,
    })
    assert.equal(hours.body.length, 7)
    assert.equal(hours.body[0].isOpen, false)
    assert.equal(hours.body[1].openTime, '09:00')

    const restrictions = await call(
      'GET',
      `/resources/${resource.id}/restrictions`,
      { token: ana.token },
    )
    assert.equal(restrictions.body.slotStepMinutes, 30)
  })

  test('restrictions and hours are validated', async () => {
    const badRestrictions = await call(
      'PUT',
      `/resources/${resource.id}/restrictions`,
      {
        token: admin.token,
        body: {
          minDurationMinutes: 120,
          maxDurationMinutes: 60,
          maxAdvanceDays: 30,
          slotStepMinutes: 30,
        },
      },
    )
    assert.equal(badRestrictions.status, 422)

    const badHours = await call('PUT', `/resources/${resource.id}/hours`, {
      token: admin.token,
      body: {
        hours: [
          { dayOfWeek: 1, isOpen: true, openTime: '18:00', closeTime: '09:00' },
        ],
      },
    })
    assert.equal(badHours.status, 422)
  })

  test('malformed ids return 404', async () => {
    assert.equal(
      (await call('GET', '/resources/not-an-id', { token: ana.token })).status,
      404,
    )
  })
})

describe('bookings', () => {
  const monday = nextWeekday(1)
  const sunday = nextWeekday(0)
  let firstBooking

  test('creates a booking inside opening hours', async () => {
    const { status, body } = await call('POST', '/bookings', {
      token: ana.token,
      body: {
        resourceId: resource.id,
        ...slot(monday, '10:00', '11:00'),
        purpose: 'Planning',
      },
    })
    assert.equal(status, 201)
    assert.equal(body.status, 'confirmed')
    assert.equal(body.resourceName, resource.name)
    firstBooking = body
  })

  test('rejects overlapping bookings but allows back to back ones', async () => {
    const clash = await call('POST', '/bookings', {
      token: ravi.token,
      body: { resourceId: resource.id, ...slot(monday, '10:30', '11:30') },
    })
    assert.equal(clash.status, 409)

    const adjacent = await call('POST', '/bookings', {
      token: ravi.token,
      body: { resourceId: resource.id, ...slot(monday, '11:00', '12:00') },
    })
    assert.equal(adjacent.status, 201)
  })

  test('only one of many simultaneous requests wins the slot', async () => {
    const attempts = await Promise.all(
      Array.from({ length: 6 }, () =>
        call('POST', '/bookings', {
          token: ravi.token,
          body: { resourceId: resource.id, ...slot(monday, '14:00', '15:00') },
        }),
      ),
    )
    const statuses = attempts.map((attempt) => attempt.status).sort()
    assert.deepEqual(statuses, [201, 409, 409, 409, 409, 409])
  })

  test('enforces opening hours, step, duration and past times', async () => {
    const attempt = (from, to, date = monday) =>
      call('POST', '/bookings', {
        token: ana.token,
        body: { resourceId: resource.id, ...slot(date, from, to) },
      })

    assert.equal((await attempt('10:00', '11:00', sunday)).status, 422)
    assert.equal((await attempt('07:00', '08:00')).status, 422)
    assert.equal((await attempt('17:30', '18:30')).status, 422)
    assert.equal((await attempt('16:10', '17:00')).status, 422)
    assert.equal((await attempt('09:00', '09:15')).status, 422)
    assert.equal((await attempt('09:00', '15:00')).status, 422)

    const past = await call('POST', '/bookings', {
      token: ana.token,
      body: {
        resourceId: resource.id,
        startTime: '2020-01-06T04:30:00.000Z',
        endTime: '2020-01-06T05:30:00.000Z',
      },
    })
    assert.equal(past.status, 422)

    const tooFar = await call('POST', '/bookings', {
      token: ana.token,
      body: {
        resourceId: resource.id,
        ...slot(nextWeekday(2, 60), '10:00', '11:00'),
      },
    })
    assert.equal(tooFar.status, 422)
  })

  test('validates the payload shape', async () => {
    const response = await call('POST', '/bookings', {
      token: ana.token,
      body: { resourceId: 'abc' },
    })
    assert.equal(response.status, 422)
  })

  test('owners can read and edit, strangers cannot', async () => {
    assert.equal(
      (await call('GET', `/bookings/${firstBooking.id}`, { token: ravi.token }))
        .status,
      403,
    )
    assert.equal(
      (
        await call('GET', `/bookings/${firstBooking.id}`, {
          token: admin.token,
        })
      ).status,
      200,
    )

    const stranger = await call('PUT', `/bookings/${firstBooking.id}`, {
      token: ravi.token,
      body: { resourceId: resource.id, ...slot(monday, '09:00', '10:00') },
    })
    assert.equal(stranger.status, 403)

    const own = await call('PUT', `/bookings/${firstBooking.id}`, {
      token: ana.token,
      body: {
        resourceId: resource.id,
        ...slot(monday, '09:00', '10:00'),
        purpose: 'Moved',
      },
    })
    assert.equal(own.status, 200)
    assert.equal(own.body.purpose, 'Moved')

    const intoOther = await call('PUT', `/bookings/${firstBooking.id}`, {
      token: ana.token,
      body: { resourceId: resource.id, ...slot(monday, '10:30', '11:30') },
    })
    assert.equal(intoOther.status, 409)
  })

  test('calendar hides purpose of other people bookings', async () => {
    const from = new Date(`${monday}T00:00:00+05:30`)
    const to = new Date(from.getTime() + 86400000)
    const query = `from=${from.toISOString()}&to=${to.toISOString()}&resourceId=${resource.id}`

    const asRavi = await call('GET', `/bookings/calendar?${query}`, {
      token: ravi.token,
    })
    const anasEntry = asRavi.body.find(
      (booking) => booking.id === firstBooking.id,
    )
    assert.equal(anasEntry.purpose, null)
    assert.equal(anasEntry.userEmail, null)
    assert.equal(anasEntry.userName, 'Test ana')

    const asAna = await call('GET', `/bookings/calendar?${query}`, {
      token: ana.token,
    })
    assert.equal(
      asAna.body.find((booking) => booking.id === firstBooking.id).purpose,
      'Moved',
    )
  })

  test('mine lists only own bookings', async () => {
    const { body } = await call('GET', '/bookings/mine', { token: ana.token })
    assert.ok(body.length >= 1)
    assert.ok(body.every((booking) => booking.userId === ana.user.id))
  })

  test('admin list needs admin rights and supports filters', async () => {
    assert.equal(
      (await call('GET', '/bookings', { token: ana.token })).status,
      403,
    )

    const byUser = await call(
      'GET',
      `/bookings?search=ravi.${runId}&resourceId=${resource.id}`,
      { token: admin.token },
    )
    assert.equal(byUser.status, 200)
    assert.ok(byUser.body.length >= 2)
    assert.ok(byUser.body.every((booking) => booking.userId === ravi.user.id))

    const byDate = await call(
      'GET',
      `/bookings?date=${monday}&resourceId=${resource.id}&status=confirmed`,
      { token: admin.token },
    )
    assert.ok(byDate.body.length >= 3)

    const badStatus = await call('GET', '/bookings?status=nonsense', {
      token: admin.token,
    })
    assert.equal(badStatus.status, 422)
  })

  test('cancelling frees the slot', async () => {
    const stranger = await call(
      'PATCH',
      `/bookings/${firstBooking.id}/cancel`,
      { token: ravi.token },
    )
    assert.equal(stranger.status, 403)

    const cancelled = await call(
      'PATCH',
      `/bookings/${firstBooking.id}/cancel`,
      { token: ana.token },
    )
    assert.equal(cancelled.status, 200)
    assert.equal(cancelled.body.status, 'cancelled')

    const again = await call('PATCH', `/bookings/${firstBooking.id}/cancel`, {
      token: ana.token,
    })
    assert.equal(again.status, 409)

    const rebook = await call('POST', '/bookings', {
      token: ravi.token,
      body: { resourceId: resource.id, ...slot(monday, '09:00', '10:00') },
    })
    assert.equal(rebook.status, 201)

    const { rows } = await pool.query(
      'select action from booking_history where booking_id = $1 order by created_at',
      [firstBooking.id],
    )
    assert.deepEqual(
      rows.map((row) => row.action),
      ['created', 'edited', 'cancelled'],
    )
  })

  test('admins can cancel any booking', async () => {
    const { body: created } = await call('POST', '/bookings', {
      token: ana.token,
      body: { resourceId: resource.id, ...slot(monday, '16:00', '17:00') },
    })
    const cancelled = await call('PATCH', `/bookings/${created.id}/cancel`, {
      token: admin.token,
    })
    assert.equal(cancelled.status, 200)
  })

  test('availability shows busy and free slots for a day', async () => {
    const date = nextWeekday(2)
    const { body: created } = await call('POST', '/bookings', {
      token: ana.token,
      body: { resourceId: resource.id, ...slot(date, '10:00', '11:00') },
    })

    const { status, body } = await call(
      'GET',
      `/resources/${resource.id}/availability?date=${date}`,
      { token: ravi.token },
    )

    assert.equal(status, 200)
    assert.equal(body.isOpen, true)
    assert.equal(body.busy.length, 1)
    assert.equal(body.busy[0].bookingId, created.id)

    const busyStart = slot(date, '10:00', '11:00').startTime
    const busyHalfHour = slot(date, '10:30', '11:00').startTime
    const freeStarts = body.freeSlots.map((item) => item.startTime)

    assert.ok(!freeStarts.includes(busyStart))
    assert.ok(!freeStarts.includes(busyHalfHour))
    assert.ok(freeStarts.includes(slot(date, '09:00', '09:30').startTime))
    assert.ok(freeStarts.includes(slot(date, '11:00', '11:30').startTime))
  })

  test('availability is empty on closed days and validates the date', async () => {
    const closed = await call(
      'GET',
      `/resources/${resource.id}/availability?date=${sunday}`,
      { token: ana.token },
    )
    assert.equal(closed.status, 200)
    assert.equal(closed.body.isOpen, false)
    assert.deepEqual(closed.body.freeSlots, [])

    const badFormat = await call(
      'GET',
      `/resources/${resource.id}/availability?date=tomorrow`,
      { token: ana.token },
    )
    assert.equal(badFormat.status, 422)

    const fakeDate = await call(
      'GET',
      `/resources/${resource.id}/availability?date=2026-02-31`,
      { token: ana.token },
    )
    assert.equal(fakeDate.status, 422)
  })

  test('resources can be filtered by type, capacity and search', async () => {
    const rooms = await call('GET', '/resources?type=room&minCapacity=8', {
      token: ana.token,
    })
    assert.equal(rooms.status, 200)
    assert.ok(rooms.body.some((item) => item.id === resource.id))
    assert.ok(rooms.body.every((item) => item.type === 'room'))
    assert.ok(rooms.body.every((item) => item.capacity >= 8))

    const tooBig = await call('GET', '/resources?minCapacity=100000', {
      token: ana.token,
    })
    assert.ok(!tooBig.body.some((item) => item.id === resource.id))

    const found = await call('GET', `/resources?search=${runId}`, {
      token: ana.token,
    })
    assert.ok(found.body.some((item) => item.id === resource.id))

    const badType = await call('GET', '/resources?type=car', {
      token: ana.token,
    })
    assert.equal(badType.status, 422)
  })

  test('booking history lists every change for owners and admins', async () => {
    const date = nextWeekday(4)
    const { body: created } = await call('POST', '/bookings', {
      token: ana.token,
      body: { resourceId: resource.id, ...slot(date, '12:00', '13:00') },
    })

    await call('PUT', `/bookings/${created.id}`, {
      token: ana.token,
      body: slot(date, '13:00', '14:00'),
    })
    await call('PATCH', `/bookings/${created.id}/cancel`, { token: ana.token })

    const own = await call('GET', `/bookings/${created.id}/history`, {
      token: ana.token,
    })
    assert.equal(own.status, 200)
    assert.deepEqual(
      own.body.map((entry) => entry.action),
      ['created', 'edited', 'cancelled'],
    )

    const byAdmin = await call('GET', `/bookings/${created.id}/history`, {
      token: admin.token,
    })
    assert.equal(byAdmin.status, 200)

    const byStranger = await call('GET', `/bookings/${created.id}/history`, {
      token: ravi.token,
    })
    assert.equal(byStranger.status, 403)
  })

  test('finished bookings are reported as completed', async () => {
    const { rows } = await pool.query(
      `insert into bookings (resource_id, user_id, start_time, end_time)
       values ($1, $2, now() - interval '3 hours', now() - interval '2 hours')
       returning id`,
      [resource.id, ana.user.id],
    )

    const { body } = await call('GET', `/bookings/${rows[0].id}`, {
      token: ana.token,
    })
    assert.equal(body.status, 'completed')

    const completed = await call('GET', '/bookings?status=completed', {
      token: admin.token,
    })
    assert.ok(completed.body.some((item) => item.id === rows[0].id))
  })

  test('inactive resources cannot be booked', async () => {
    const disabled = await call('PATCH', `/resources/${resource.id}/status`, {
      token: admin.token,
      body: { isActive: false },
    })
    assert.equal(disabled.status, 200)
    assert.equal(disabled.body.isActive, false)
    assert.ok(disabled.body.upcomingBookings >= 1)

    const blocked = await call('POST', '/bookings', {
      token: ana.token,
      body: {
        resourceId: resource.id,
        ...slot(nextWeekday(3), '10:00', '11:00'),
      },
    })
    assert.equal(blocked.status, 409)

    const hiddenFromEmployees = await call(
      'GET',
      '/resources?includeInactive=true',
      { token: ana.token },
    )
    assert.ok(!hiddenFromEmployees.body.some((item) => item.id === resource.id))

    const flagged = await call('GET', '/bookings?needsAttention=true', {
      token: admin.token,
    })
    assert.equal(flagged.status, 200)
    assert.ok(flagged.body.every((item) => item.resourceActive === false))

    const visibleToAdmin = await call(
      'GET',
      '/resources?includeInactive=true',
      { token: admin.token },
    )
    assert.ok(visibleToAdmin.body.some((item) => item.id === resource.id))
  })
})
