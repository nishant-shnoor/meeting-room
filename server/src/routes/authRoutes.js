import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import env from '../config/env.js'
import {
  changePassword,
  currentUser,
  forgotPassword,
  login,
  register,
  updateProfile,
} from '../controllers/authController.js'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import {
  forgotPasswordSchema,
  loginSchema,
  passwordChangeSchema,
  profileSchema,
  registerSchema,
} from '../validation/authSchemas.js'

const router = Router()

const signInLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skip: () => env.nodeEnv === 'test',
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
})

router.post('/register', signInLimiter, validate(registerSchema), register)
router.post('/login', signInLimiter, validate(loginSchema), login)
router.post(
  '/forgot-password',
  signInLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
)
router.get('/me', authenticate, currentUser)
router.put('/me', authenticate, validate(profileSchema), updateProfile)
router.put(
  '/me/password',
  authenticate,
  signInLimiter,
  validate(passwordChangeSchema),
  changePassword,
)

export default router
