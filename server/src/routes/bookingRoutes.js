import { Router } from 'express'
import * as bookings from '../controllers/bookingController.js'
import { authenticate, requireAdmin } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { uuidPattern } from '../utils/constants.js'
import { notFound } from '../utils/httpError.js'
import {
  bookingFiltersSchema,
  bookingSchema,
  bookingUpdateSchema,
  calendarQuerySchema,
} from '../validation/bookingSchemas.js'

const router = Router()

router.param('id', (req, res, next, id) => (uuidPattern.test(id) ? next() : next(notFound('Booking not found'))))

router.use(authenticate)

router.get('/mine', bookings.listMine)
router.get('/calendar', validate(calendarQuerySchema, 'query'), bookings.listCalendar)
router.get('/', requireAdmin, validate(bookingFiltersSchema, 'query'), bookings.listAll)
router.post('/', validate(bookingSchema), bookings.create)

router.get('/:id', bookings.getOne)
router.put('/:id', validate(bookingUpdateSchema), bookings.edit)
router.patch('/:id/cancel', bookings.cancel)

export default router
