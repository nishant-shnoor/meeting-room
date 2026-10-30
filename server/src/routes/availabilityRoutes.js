import { Router } from 'express'
import { show } from '../controllers/availabilityController.js'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { availabilityQuerySchema } from '../validation/bookingSchemas.js'

const router = Router()

router.use(authenticate)
router.get('/', validate(availabilityQuerySchema, 'query'), show)

export default router
