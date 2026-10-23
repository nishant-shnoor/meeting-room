import { HttpError, notFound } from '../utils/httpError.js'

const constraintMessages = {
  users_email_key: 'An account with this email already exists',
}

export function routeNotFound(req, res, next) {
  next(notFound(`Route ${req.method} ${req.path} not found`))
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)

  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message, ...(error.fields && { errors: error.fields }) })
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body is not valid JSON' })
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large' })
  }

  if (error.code === '23505') {
    return res.status(409).json({ message: constraintMessages[error.constraint] || 'That record already exists' })
  }

  console.error(error)
  res.status(500).json({ message: 'Something went wrong on the server' })
}
