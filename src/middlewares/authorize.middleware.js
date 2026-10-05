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

// Autorización por propiedad del evento (la regla vive en eventsService): 404 si no
// existe, 403 si no es del organizer ni lo pide un admin. Deja el evento en req.event
export const authorizeEventOwnerOrAdmin = async (req, res, next) => {
  req.event = await eventsService.getManageableEvent(req.params.eid ?? req.params.id, req.user)
  next()
}

// Autorización por propiedad del ticket (la regla vive en ticketsService): lo cancela
// su dueño o un admin. Deja el ticket en req.ticket
export const authorizeTicketOwnerOrAdmin = async (req, res, next) => {
  req.ticket = await ticketsService.getCancellableTicket(req.params.tid, req.user)
  next()
}
