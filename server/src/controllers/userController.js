import bcrypt from 'bcryptjs'
import {
  countOtherActiveAdmins,
  createUser,
  dismissResetRequest,
  findUserByEmail,
  findUserById,
  listResetRequests,
  listUsers,
  resolveResetRequestsForUser,
  setUserActive,
  setUserPassword,
  toManagedUser,
  updateUserDetails,
  updateUserRole,
} from '../models/userModel.js'
import { conflict, forbidden, notFound } from '../utils/httpError.js'

const requireUser = async (id) => {
  const user = await findUserById(id)

  if (!user) {
    throw notFound('Employee not found')
  }

  return user
}

const assertAdminStaysAvailable = async (target, actingUser, change) => {
  if (target.role !== 'admin') {
    return
  }

  if (target.id === actingUser.id) {
    throw forbidden(`You cannot ${change} your own admin account`)
  }

  if ((await countOtherActiveAdmins(target.id)) === 0) {
    throw forbidden(
      `At least one active admin is required, so this account cannot be ${change === 'deactivate' ? 'deactivated' : 'demoted'}`,
    )
  }
}

export async function list(req, res) {
  const rows = await listUsers(req.validated.query)
  res.json(
    rows.map(({ user, upcomingBookings }) =>
      toManagedUser(user, { upcomingBookings }),
    ),
  )
}

export async function getOne(req, res) {
  res.json(toManagedUser(await requireUser(req.params.id)))
}

export async function create(req, res) {
  const { password, ...details } = req.validated.body

  if (await findUserByEmail(details.email)) {
    throw conflict('An account with this email already exists')
  }

  const user = await createUser({
    ...details,
    passwordHash: await bcrypt.hash(password, 10),
  })
  res.status(201).json(toManagedUser(user, { upcomingBookings: 0 }))
}

export async function update(req, res) {
  const target = await requireUser(req.params.id)
  const { role, ...details } = req.validated.body

  if (details.email !== target.email) {
    const existing = await findUserByEmail(details.email)

    if (existing && existing.id !== target.id) {
      throw conflict('An account with this email already exists')
    }
  }

  if (role !== target.role && role === 'employee') {
    await assertAdminStaysAvailable(target, req.user, 'demote')
  }

  await updateUserDetails(target.id, details)
  const user =
    role === target.role
      ? await findUserById(target.id)
      : await updateUserRole(target.id, role)
  res.json(toManagedUser(user))
}

export async function changeStatus(req, res) {
  const target = await requireUser(req.params.id)
  const { isActive } = req.validated.body

  if (!isActive) {
    await assertAdminStaysAvailable(target, req.user, 'deactivate')
  }

  res.json(toManagedUser(await setUserActive(target.id, isActive)))
}

export async function resetPassword(req, res) {
  const target = await requireUser(req.params.id)
  await setUserPassword(
    target.id,
    await bcrypt.hash(req.validated.body.password, 10),
  )
  await resolveResetRequestsForUser(target.id)
  res.json({ message: 'Password updated' })
}

export async function listResets(req, res) {
  res.json(await listResetRequests())
}

export async function dismissReset(req, res) {
  if (!(await dismissResetRequest(req.params.id))) {
    throw notFound('Request not found')
  }

  res.json({ message: 'Request dismissed' })
}
