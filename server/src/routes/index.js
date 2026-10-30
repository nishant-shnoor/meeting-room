import { Router } from 'express'
import pool from '../config/db.js'
import authRoutes from './authRoutes.js'
import availabilityRoutes from './availabilityRoutes.js'
import bookingRoutes from './bookingRoutes.js'
import resourceRoutes from './resourceRoutes.js'
import userRoutes from './userRoutes.js'

const router = Router()

router.get('/health', async (req, res) => {
  await pool.query('select 1')
  res.json({ status: 'ok' })
})

router.use('/auth', authRoutes)
router.use('/resources', resourceRoutes)
router.use('/bookings', bookingRoutes)
router.use('/availability', availabilityRoutes)
router.use('/users', userRoutes)

export default router
