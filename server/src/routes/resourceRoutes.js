import { Router } from 'express'
import * as resources from '../controllers/resourceController.js'
import { authenticate, requireAdmin } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { resourceSchema } from '../validation/resourceSchemas.js'

const router = Router()

router.use(authenticate)

router.get('/', resources.list)
router.post('/', requireAdmin, validate(resourceSchema), resources.create)

export default router
