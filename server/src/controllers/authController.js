import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import env from '../config/env.js'
import {
  createResetRequest,
  createUser,
  findUserByEmail,
  setUserPassword,
  toPublicUser,
  updateUserDetails,
} from '../models/userModel.js'
import {
  conflict,
  forbidden,
  invalid,
  unauthorized,
} from '../utils/httpError.js'

const unknownUserHash = bcrypt.hashSync('not-a-real-password', 10)

const issueToken = (user) =>
  jwt.sign({ role: user.role }, env.jwtSecret, {
    subject: user.id,
    expiresIn: env.jwtExpiresIn,
  })

const sessionFor = (user) => ({
  token: issueToken(user),
  user: toPublicUser(user),
})

export async function register(req, res) {
  const { name, email, password } = req.validated.body

  if (await findUserByEmail(email)) {
    throw conflict('An account with this email already exists')
  }

  const user = await createUser({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
  })
  res.status(201).json(sessionFor(user))
}

export async function login(req, res) {
  const { email, password } = req.validated.body

  const user = await findUserByEmail(email)
  const passwordMatches = await bcrypt.compare(
    password,
    user?.passwordHash ?? unknownUserHash,
  )

  if (!user || !passwordMatches) {
    throw unauthorized('Invalid email or password')
  }

  if (!user.isActive) {
    throw forbidden('This account has been deactivated')
  }

  res.json(sessionFor(user))
}

export function currentUser(req, res) {
  res.json(toPublicUser(req.user))
}

export async function updateProfile(req, res) {
  const details = req.validated.body

  if (details.email !== req.user.email) {
    const existing = await findUserByEmail(details.email)

    if (existing && existing.id !== req.user.id) {
      throw conflict('An account with this email already exists')
    }
  }

  const user = await updateUserDetails(req.user.id, details)
  res.json(toPublicUser(user))
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.validated.body

  if (!(await bcrypt.compare(currentPassword, req.user.passwordHash))) {
    throw invalid('Current password is incorrect', {
      currentPassword: 'Current password is incorrect',
    })
  }

  if (currentPassword === newPassword) {
    throw invalid('Choose a password different from the current one', {
      newPassword: 'Choose a password different from the current one',
    })
  }

  await setUserPassword(req.user.id, await bcrypt.hash(newPassword, 10))
  res.json({ message: 'Password updated' })
}

export async function forgotPassword(req, res) {
  const user = await findUserByEmail(req.validated.body.email)

  if (user?.isActive) {
    await createResetRequest(user.id)
  }

  res.json({
    message:
      'If that email belongs to an account, your administrator has been notified and will set a new password for you.',
  })
}
