import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import env from '../config/env.js'
import { currentUser, login, register } from '../controllers/authController.js'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { loginSchema, registerSchema } from '../validation/authSchemas.js'

const router = Router()

const signInLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skip: () => env.nodeEnv === 'test',
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
})

router.post('/register', signInLimiter, validate(registerSchema), register)
router.post('/login', signInLimiter, validate(loginSchema), login)
router.get('/me', authenticate, currentUser)

export default router
