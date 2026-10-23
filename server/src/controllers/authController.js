import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import env from '../config/env.js'
import { createUser, findUserByEmail, toPublicUser } from '../models/userModel.js'
import { conflict, forbidden, unauthorized } from '../utils/httpError.js'

const unknownUserHash = bcrypt.hashSync('not-a-real-password', 10)

const issueToken = (user) => jwt.sign({ role: user.role }, env.jwtSecret, { subject: user.id, expiresIn: env.jwtExpiresIn })

const sessionFor = (user) => ({ token: issueToken(user), user: toPublicUser(user) })

export async function register(req, res) {
  const { name, email, password } = req.validated.body

  if (await findUserByEmail(email)) throw conflict('An account with this email already exists')

  const user = await createUser({ name, email, passwordHash: await bcrypt.hash(password, 10) })
  res.status(201).json(sessionFor(user))
}

export async function login(req, res) {
  const { email, password } = req.validated.body

  const user = await findUserByEmail(email)
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? unknownUserHash)

  if (!user || !passwordMatches) throw unauthorized('Invalid email or password')
  if (!user.isActive) throw forbidden('This account has been deactivated')

  res.json(sessionFor(user))
}

export function currentUser(req, res) {
  res.json(toPublicUser(req.user))
}
