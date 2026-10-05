import { Router } from 'express'
import { getMyTickets, cancelTicket } from '../controllers/tickets.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { authorizeTicketOwnerOrAdmin } from '../middlewares/authorize.middleware.js'

const router = Router()

router.get('/my-tickets', authenticate, getMyTickets)

router.patch('/:tid/cancel', authenticate, authorizeTicketOwnerOrAdmin, cancelTicket)

export default router
