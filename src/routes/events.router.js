import { Router } from 'express'
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  changeEventStatus
} from '../controllers/events.controller.js'
import { createTicket, getEventTickets } from '../controllers/tickets.controller.js'
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware.js'
import { authorizeRoles, authorizeEventOwnerOrAdmin } from '../middlewares/authorize.middleware.js'
import { PERMISSIONS } from '../config/permissions.js'

const router = Router()

router.get('/', getEvents)

router.get('/:id', optionalAuthenticate, getEventById)

router.post('/', authenticate, authorizeRoles(...PERMISSIONS.createEvent), createEvent)

router.put(
  '/:id',
  authenticate,
  authorizeRoles(...PERMISSIONS.manageOwnEvent),
  authorizeEventOwnerOrAdmin,
  updateEvent
)

router.patch(
  '/:id/status',
  authenticate,
  authorizeRoles(...PERMISSIONS.manageOwnEvent),
  authorizeEventOwnerOrAdmin,
  changeEventStatus
)

router.post('/:eid/tickets', authenticate, authorizeRoles(...PERMISSIONS.enrollInEvent), createTicket)

router.get(
  '/:eid/tickets',
  authenticate,
  authorizeRoles(...PERMISSIONS.viewOwnEventTickets),
  authorizeEventOwnerOrAdmin,
  getEventTickets
)

export default router
