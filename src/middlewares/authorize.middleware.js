import { canManageEvent, canManageTicket } from '../config/permissions.js'
import { eventsService } from '../services/events.service.js'
import { ticketsService } from '../services/tickets.service.js'
import { AppError, ERROR_MESSAGES } from '../utils/errors.js'

// Autorización por rol: se usa después de authenticate. Sin una regla que lo
// permita explícitamente, el acceso se rechaza
export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    throw new AppError(ERROR_MESSAGES.unauthenticated, 401)
  }

  if (!allowedRoles.includes(req.user.role)) {
    throw new AppError(ERROR_MESSAGES.forbidden, 403)
  }

  next()
}

// Autorización por propiedad: el organizer solo puede gestionar sus propios
// eventos; los roles con manageAnyEvent (admin) pueden gestionar cualquiera
export const authorizeEventOwnerOrAdmin = async (req, res, next) => {
  const event = await eventsService.findEventOrFail(req.params.eid ?? req.params.id)

  if (!canManageEvent(req.user, event)) {
    throw new AppError(ERROR_MESSAGES.eventForbidden, 403)
  }

  req.event = event
  next()
}

// Autorización por propiedad del ticket: lo cancela su dueño o un admin
export const authorizeTicketOwnerOrAdmin = async (req, res, next) => {
  const ticket = await ticketsService.findTicketOrFail(req.params.tid)

  if (!canManageTicket(req.user, ticket)) {
    throw new AppError(ERROR_MESSAGES.ticketForbidden, 403)
  }

  req.ticket = ticket
  next()
}
