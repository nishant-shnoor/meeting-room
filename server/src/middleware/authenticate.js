import jwt from 'jsonwebtoken'
import env from '../config/env.js'
import { findUserById } from '../models/userModel.js'
import { forbidden, unauthorized } from '../utils/httpError.js'

export async function authenticate(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ')

  if (scheme !== 'Bearer' || !token) {
    throw unauthorized('Please sign in to continue')
  }

  let payload

  try {
    payload = jwt.verify(token, env.jwtSecret)
  } catch {
    throw unauthorized('Your session has expired. Please sign in again')
  }

  const user = await findUserById(payload.sub)

  if (!user?.isActive) {
    throw unauthorized('Your session is no longer valid')
  }

  req.user = user
  next()
}

export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    throw forbidden('Admin access required')
  }

  next()
}
