import { Router } from 'express'
import { getUsers, changeUserRole } from '../controllers/users.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { authorizeRoles } from '../middlewares/authorize.middleware.js'
import { PERMISSIONS } from '../config/permissions.js'

const router = Router()

router.get('/', authenticate, authorizeRoles(...PERMISSIONS.readUsers), getUsers)

router.patch('/:uid/role', authenticate, authorizeRoles(...PERMISSIONS.changeUserRole), changeUserRole)

export default router
