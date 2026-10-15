import { isPopulated, refId } from './helpers.js'
import { EventSummaryDTO } from './event.dto.js'
import { UserSummaryDTO } from './user.dto.js'

// Inscripción. Si event o user vienen con populate, también pasan por su DTO
// para devolver solo los campos básicos del documento relacionado
export class TicketDTO {
  constructor (ticket) {
    this.id = refId(ticket)
    this.event = isPopulated(ticket.event) ? new EventSummaryDTO(ticket.event) : refId(ticket.event)
    this.user = isPopulated(ticket.user) ? new UserSummaryDTO(ticket.user) : refId(ticket.user)
    this.quantity = ticket.quantity
    this.status = ticket.status
    this.reservationCode = ticket.reservationCode
    this.createdAt = ticket.createdAt
    this.cancelledAt = ticket.cancelledAt
  }
}
