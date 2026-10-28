import { Router } from 'express'
import * as resources from '../controllers/resourceController.js'
import { authenticate, requireAdmin } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { uuidPattern } from '../utils/constants.js'
import { notFound } from '../utils/httpError.js'
import {
  availabilityQuerySchema,
  hoursSchema,
  resourceListQuerySchema,
  resourceSchema,
  restrictionsSchema,
  statusSchema,
} from '../validation/resourceSchemas.js'

const router = Router()

router.param('id', (req, res, next, id) =>
  uuidPattern.test(id) ? next() : next(notFound('Resource not found')),
)

router.use(authenticate)

router.get('/', validate(resourceListQuerySchema, 'query'), resources.list)
router.post('/', requireAdmin, validate(resourceSchema), resources.create)

router.get('/:id', resources.getOne)
router.put('/:id', requireAdmin, validate(resourceSchema), resources.update)
router.patch(
  '/:id/status',
  requireAdmin,
  validate(statusSchema),
  resources.changeStatus,
)

router.get(
  '/:id/availability',
  validate(availabilityQuerySchema, 'query'),
  resources.availability,
)

router.get('/:id/hours', resources.readHours)
router.put(
  '/:id/hours',
  requireAdmin,
  validate(hoursSchema),
  resources.saveHours,
)

router.get('/:id/restrictions', resources.readRestrictions)
router.put(
  '/:id/restrictions',
  requireAdmin,
  validate(restrictionsSchema),
  resources.saveRules,
)

export default router
