import { ticketsDao } from '../dao/tickets.dao.js'
import { ACTIVE_TICKET_STATUSES, TICKET_STATUS } from '../config/constants.js'

const EVENT_FIELDS = 'title date location category status'
const USER_FIELDS = 'first_name last_name email'

class TicketsRepository {
  constructor (dao) {
    this.dao = dao
  }

  create (data) {
    return this.dao.create(data)
  }

  getById (id) {
    return this.dao.findById(id)
  }

  getActiveByUserAndEvent (userId, eventId) {
    return this.dao.findOne({ user: userId, event: eventId, status: { $in: ACTIVE_TICKET_STATUSES } })
  }

  getByUser (userId) {
    return this.dao.find({ user: userId }, { populate: { path: 'event', select: EVENT_FIELDS } })
  }

  getByEvent (eventId) {
    return this.dao.find({ event: eventId }, { populate: { path: 'user', select: USER_FIELDS } })
  }

  // Cupos ocupados: solo suman los tickets activos (pending o confirmed)
  getOccupiedSeats (eventId, { upToTicketId } = {}) {
    return this.dao.sumQuantity({ event: eventId, statuses: ACTIVE_TICKET_STATUSES, maxId: upToTicketId })
  }

  confirm (id) {
    return this.dao.updateOne({ _id: id, status: TICKET_STATUS.PENDING }, { status: TICKET_STATUS.CONFIRMED })
  }

  // Solo cancela si el ticket sigue activo, así dos cancelaciones simultáneas no se pisan
  cancel (id) {
    return this.dao.updateOne(
      { _id: id, status: { $in: ACTIVE_TICKET_STATUSES } },
      { status: TICKET_STATUS.CANCELLED, cancelledAt: new Date() }
    )
  }
}

export const ticketsRepository = new TicketsRepository(ticketsDao)
