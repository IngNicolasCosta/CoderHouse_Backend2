import { PERMISSIONS } from '../config/permissions.js'
import { eventsService } from '../services/events.service.js'
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
  const event = await eventsService.getEventById(req.params.eventId)

  const canManageAny = PERMISSIONS.manageAnyEvent.includes(req.user.role)
  const isOwner = event.organizer === req.user.id

  if (!canManageAny && !isOwner) {
    throw new AppError(ERROR_MESSAGES.eventForbidden, 403)
  }

  req.event = event
  next()
}
