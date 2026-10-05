import { Router } from 'express'
import { getEvents, createEvent, updateEvent, cancelEvent } from '../controllers/events.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { authorizeRoles, authorizeEventOwnerOrAdmin } from '../middlewares/authorize.middleware.js'
import { PERMISSIONS } from '../config/permissions.js'

const router = Router()

router.get('/', getEvents)

router.post('/', authenticate, authorizeRoles(...PERMISSIONS.createEvent), createEvent)

router.put(
  '/:eventId',
  authenticate,
  authorizeRoles(...PERMISSIONS.manageOwnEvent),
  authorizeEventOwnerOrAdmin,
  updateEvent
)

router.patch(
  '/:eventId/cancel',
  authenticate,
  authorizeRoles(...PERMISSIONS.manageOwnEvent),
  authorizeEventOwnerOrAdmin,
  cancelEvent
)

export default router
