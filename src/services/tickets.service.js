import { ticketRepository } from '../repositories/tickets.repository.js'
import { userRepository } from '../repositories/users.repository.js'
import { eventsService } from './events.service.js'
import { mailService } from './mail.service.js'
import { TicketDTO } from '../dto/ticket.dto.js'
import { EVENT_STATUS, TICKET_STATUS } from '../config/constants.js'
import { canManageTicket } from '../config/permissions.js'
import { AppError, ERROR_MESSAGES } from '../utils/errors.js'
import { generateReservationCode } from '../utils/codes.js'

const DUPLICATE_KEY_ERROR = 11000
const MAX_CODE_ATTEMPTS = 3

const conflict = (message) => new AppError(message, 409)

const parseQuantity = (value) => {
  if (value === undefined) return 1
  const quantity = typeof value === 'number' || (typeof value === 'string' && value.trim() !== '') ? Number(value) : NaN
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new AppError('La cantidad debe ser un número entero mayor a 0', 400)
  }
  return quantity
}

const noSeatsError = (available, quantity) => conflict(available === 0
  ? 'No quedan cupos disponibles para este evento'
  : `No hay cupos suficientes: quedan ${available} y pediste ${quantity}`)

const assertEventOpen = (event) => {
  if (event.status === EVENT_STATUS.CANCELLED) {
    throw conflict('No es posible inscribirse a un evento cancelado')
  }
  if (event.status === EVENT_STATUS.FINISHED) {
    throw conflict('No es posible inscribirse a un evento finalizado')
  }
  if (event.status !== EVENT_STATUS.PUBLISHED) {
    throw conflict('El evento no está disponible para inscripciones')
  }
  if (new Date(event.date) <= new Date()) {
    throw conflict('No es posible inscribirse a un evento que ya ocurrió')
  }
}

class TicketsService {
  constructor (repository) {
    this.repository = repository
  }

  async createTicket (eventId, user, input = {}) {
    const quantity = parseQuantity(input.quantity)
    const event = await eventsService.getVisibleEvent(eventId, user)
    assertEventOpen(event)

    if (await this.repository.findActiveByUserAndEvent(user.id, event.id)) {
      throw conflict(ERROR_MESSAGES.duplicateTicket)
    }

    if (quantity > event.availableSeats) {
      throw noSeatsError(event.availableSeats, quantity)
    }

    // El ticket se crea como pending y se verifica el cupo contando solo las reservas
    // anteriores a esta: si entraron varias inscripciones al mismo tiempo por los
    // últimos lugares, las primeras se confirman y las que se pasan del cupo se cancelan
    const ticket = await this.reserve(event.id, user.id, quantity)
    const occupiedUpToThis = await this.repository.countOccupiedSeats(event.id, { upToTicketId: ticket._id })

    if (occupiedUpToThis > event.capacity) {
      await this.repository.cancelTicket(ticket._id)
      throw noSeatsError(Math.max(event.capacity - (occupiedUpToThis - quantity), 0), quantity)
    }

    const confirmed = await this.repository.confirmTicket(ticket._id)
    this.notifyConfirmation(user.id, event, confirmed)
    return new TicketDTO(confirmed)
  }

  async reserve (eventId, userId, quantity) {
    for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt++) {
      try {
        return await this.repository.createTicket({
          user: userId,
          event: eventId,
          quantity,
          status: TICKET_STATUS.PENDING,
          reservationCode: generateReservationCode()
        })
      } catch (error) {
        if (error.code !== DUPLICATE_KEY_ERROR) throw error
        // Código de reserva repetido: se reintenta con otro. Si no, es una inscripción duplicada
        if (!error.keyPattern?.reservationCode) throw conflict(ERROR_MESSAGES.duplicateTicket)
      }
    }
    throw new Error('No se pudo generar un código de reserva único')
  }

  // Los emails se envían en segundo plano: si el envío falla, la operación
  // (inscripción o cancelación) ya quedó hecha igual y el error se registra
  notifyUser (userId, sendEmail) {
    userRepository.findById(userId)
      .then((user) => sendEmail({ to: user.email, name: user.first_name }))
      .catch((error) => console.error('No se pudo enviar el email:', error.message))
  }

  notifyConfirmation (userId, event, ticket) {
    this.notifyUser(userId, (recipient) => mailService.sendTicketConfirmation({ ...recipient, event, ticket }))
  }

  notifyCancellation (userId, event, ticket, cancelledByAdmin) {
    this.notifyUser(userId, (recipient) =>
      mailService.sendTicketCancellation({ ...recipient, event, ticket, cancelledByAdmin }))
  }

  async findTicketOrFail (id) {
    const ticket = await this.repository.findById(id)

    if (!ticket) {
      throw new AppError(ERROR_MESSAGES.ticketNotFound, 404)
    }

    return new TicketDTO(ticket)
  }

  // Permisos sobre recursos propios: un ticket lo cancela su dueño o un admin
  async getCancellableTicket (id, user) {
    const ticket = await this.findTicketOrFail(id)

    if (!canManageTicket(user, ticket)) {
      throw new AppError(ERROR_MESSAGES.ticketForbidden, 403)
    }

    return ticket
  }

  async getMyTickets (userId) {
    const tickets = await this.repository.findByUser(userId)
    return tickets.map((ticket) => new TicketDTO(ticket))
  }

  async getEventTickets (event) {
    const [tickets, occupied] = await Promise.all([
      this.repository.findByEvent(event.id),
      this.repository.countOccupiedSeats(event.id)
    ])

    return {
      tickets: tickets.map((ticket) => new TicketDTO(ticket)),
      summary: { capacity: event.capacity, occupied, available: Math.max(event.capacity - occupied, 0) }
    }
  }

  async cancelTicket (ticket, requester) {
    if (ticket.status === TICKET_STATUS.CANCELLED) {
      throw conflict('La inscripción ya está cancelada')
    }

    const event = await eventsService.findEventOrFail(ticket.event)
    if (event.status === EVENT_STATUS.FINISHED || new Date(event.date) <= new Date()) {
      throw conflict('No se puede cancelar una inscripción de un evento que ya ocurrió')
    }

    const cancelled = await this.repository.cancelTicket(ticket.id)
    if (!cancelled) {
      throw conflict('La inscripción ya está cancelada')
    }

    // Se avisa siempre al dueño del ticket, aclarando si lo canceló otra persona (admin)
    this.notifyCancellation(ticket.user, event, cancelled, ticket.user !== requester.id)
    return new TicketDTO(cancelled)
  }
}

export const ticketsService = new TicketsService(ticketRepository)
