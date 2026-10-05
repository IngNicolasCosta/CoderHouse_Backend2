import { TicketDAO } from '../dao/tickets.dao.js'
import { ACTIVE_TICKET_STATUSES, TICKET_STATUS } from '../config/constants.js'

const EVENT_FIELDS = 'title date location category status'
const USER_FIELDS = 'first_name last_name email'
const NEWEST_FIRST = { createdAt: -1 }

export class TicketRepository {
  constructor (dao = new TicketDAO()) {
    this.dao = dao
  }

  createTicket (data) {
    return this.dao.create(data)
  }

  findById (id) {
    return this.dao.findById(id)
  }

  findActiveByUserAndEvent (userId, eventId) {
    return this.dao.findOne({ user: userId, event: eventId, status: { $in: ACTIVE_TICKET_STATUSES } })
  }

  // Populate solo con los campos básicos del evento
  findByUser (userId) {
    return this.dao.find({ user: userId }, { sort: NEWEST_FIRST, populate: { path: 'event', select: EVENT_FIELDS } })
  }

  // Populate solo con los campos públicos del usuario (nunca password)
  findByEvent (eventId) {
    return this.dao.find({ event: eventId }, { sort: NEWEST_FIRST, populate: { path: 'user', select: USER_FIELDS } })
  }

  // Cupos ocupados: solo suman los tickets activos (pending o confirmed)
  countOccupiedSeats (eventId, { upToTicketId } = {}) {
    return this.dao.sumQuantity({ event: eventId, statuses: ACTIVE_TICKET_STATUSES, maxId: upToTicketId })
  }

  confirmTicket (id) {
    return this.dao.updateOne({ _id: id, status: TICKET_STATUS.PENDING }, { status: TICKET_STATUS.CONFIRMED })
  }

  // Solo cancela si el ticket sigue activo, así dos cancelaciones simultáneas no se pisan
  cancelTicket (id) {
    return this.dao.updateOne(
      { _id: id, status: { $in: ACTIVE_TICKET_STATUSES } },
      { status: TICKET_STATUS.CANCELLED, cancelledAt: new Date() }
    )
  }
}

export const ticketRepository = new TicketRepository()
