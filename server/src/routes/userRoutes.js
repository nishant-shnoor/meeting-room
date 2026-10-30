import { Router } from 'express'
import * as users from '../controllers/userController.js'
import { authenticate, requireAdmin } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { uuidPattern } from '../utils/constants.js'
import { notFound } from '../utils/httpError.js'
import {
  adminPasswordSchema,
  userCreateSchema,
  userListQuerySchema,
  userStatusSchema,
  userUpdateSchema,
} from '../validation/authSchemas.js'

const router = Router()

router.param('id', (req, res, next, id) =>
  uuidPattern.test(id) ? next() : next(notFound('Employee not found')),
)

router.use(authenticate, requireAdmin)

router.get('/', validate(userListQuerySchema, 'query'), users.list)
router.post('/', validate(userCreateSchema), users.create)

router.get('/reset-requests', users.listResets)
router.delete('/reset-requests/:id', users.dismissReset)

router.get('/:id', users.getOne)
router.put('/:id', validate(userUpdateSchema), users.update)
router.patch('/:id/status', validate(userStatusSchema), users.changeStatus)
router.put('/:id/password', validate(adminPasswordSchema), users.resetPassword)

export default router
