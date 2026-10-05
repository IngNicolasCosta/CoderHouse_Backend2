import mongoose from 'mongoose'
import { ticketsRepository } from '../repositories/tickets.repository.js'
import { usersRepository } from '../repositories/users.repository.js'
import { eventsService } from './events.service.js'
import { mailService } from './mail.service.js'
import { EVENT_STATUS, TICKET_STATUS } from '../config/constants.js'
import { AppError, ERROR_MESSAGES } from '../utils/errors.js'
import { generateReservationCode } from '../utils/codes.js'

const DUPLICATE_KEY_ERROR = 11000
const MAX_CODE_ATTEMPTS = 3

const conflict = (message) => new AppError(message, 409)

const refId = (ref) => (ref?._id ?? ref).toString()

const toTicketResponse = (ticket) => ({
  id: ticket._id.toString(),
  event: refId(ticket.event),
  user: refId(ticket.user),
  quantity: ticket.quantity,
  status: ticket.status,
  reservationCode: ticket.reservationCode,
  createdAt: ticket.createdAt,
  cancelledAt: ticket.cancelledAt
})

const toMyTicketResponse = (ticket) => ({
  ...toTicketResponse(ticket),
  event: {
    id: refId(ticket.event),
    title: ticket.event.title,
    date: ticket.event.date,
    location: ticket.event.location,
    category: ticket.event.category,
    status: ticket.event.status
  }
})

const toEventTicketResponse = (ticket) => ({
  ...toTicketResponse(ticket),
  user: {
    id: refId(ticket.user),
    first_name: ticket.user.first_name,
    last_name: ticket.user.last_name,
    email: ticket.user.email
  }
})

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

    if (await this.repository.getActiveByUserAndEvent(user.id, event.id)) {
      throw conflict(ERROR_MESSAGES.duplicateTicket)
    }

    if (quantity > event.availableSeats) {
      throw noSeatsError(event.availableSeats, quantity)
    }

    // El ticket se crea como pending y se verifica el cupo contando solo las reservas
    // anteriores a esta: si entraron varias inscripciones al mismo tiempo por los
    // últimos lugares, las primeras se confirman y las que se pasan del cupo se cancelan
    const ticket = await this.reserve(event.id, user.id, quantity)
    const occupiedUpToThis = await this.repository.getOccupiedSeats(event.id, { upToTicketId: ticket._id })

    if (occupiedUpToThis > event.capacity) {
      await this.repository.cancel(ticket._id)
      throw noSeatsError(Math.max(event.capacity - (occupiedUpToThis - quantity), 0), quantity)
    }

    const confirmed = await this.repository.confirm(ticket._id)
    this.notifyConfirmation(user.id, event, confirmed)
    return toTicketResponse(confirmed)
  }

  async reserve (eventId, userId, quantity) {
    for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt++) {
      try {
        return await this.repository.create({
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

  // El email se envía en segundo plano: si falla, la inscripción ya quedó confirmada igual
  notifyConfirmation (userId, event, ticket) {
    usersRepository.getById(userId)
      .then((user) => mailService.sendTicketConfirmation({ to: user.email, name: user.first_name, event, ticket }))
      .catch((error) => console.error('No se pudo enviar el email de confirmación:', error.message))
  }

  async findTicketOrFail (id) {
    const ticket = mongoose.isValidObjectId(id) ? await this.repository.getById(id) : null

    if (!ticket) {
      throw new AppError(ERROR_MESSAGES.ticketNotFound, 404)
    }

    return toTicketResponse(ticket)
  }

  async getMyTickets (userId) {
    const tickets = await this.repository.getByUser(userId)
    return tickets.map(toMyTicketResponse)
  }

  async getEventTickets (event) {
    const [tickets, occupied] = await Promise.all([
      this.repository.getByEvent(event.id),
      this.repository.getOccupiedSeats(event.id)
    ])

    return {
      tickets: tickets.map(toEventTicketResponse),
      summary: { capacity: event.capacity, occupied, available: Math.max(event.capacity - occupied, 0) }
    }
  }

  async cancelTicket (ticket) {
    if (ticket.status === TICKET_STATUS.CANCELLED) {
      throw conflict('La inscripción ya está cancelada')
    }

    const event = await eventsService.findEventOrFail(ticket.event)
    if (event.status === EVENT_STATUS.FINISHED || new Date(event.date) <= new Date()) {
      throw conflict('No se puede cancelar una inscripción de un evento que ya ocurrió')
    }

    const cancelled = await this.repository.cancel(ticket.id)
    if (!cancelled) {
      throw conflict('La inscripción ya está cancelada')
    }

    return toTicketResponse(cancelled)
  }
}

export const ticketsService = new TicketsService(ticketsRepository)
