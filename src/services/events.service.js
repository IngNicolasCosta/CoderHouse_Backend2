import { eventRepository } from '../repositories/events.repository.js'
import { ticketRepository } from '../repositories/tickets.repository.js'
import { EventDTO } from '../dto/response/event.dto.js'
import { EVENT_STATUS, EVENT_STATUS_TRANSITIONS } from '../config/constants.js'
import { canManageEvent } from '../config/permissions.js'
import { AppError, ERROR_MESSAGES } from '../utils/errors.js'

const CREATABLE_STATUSES = [EVENT_STATUS.DRAFT, EVENT_STATUS.PUBLISHED]
const PUBLIC_STATUSES = [EVENT_STATUS.PUBLISHED, EVENT_STATUS.CANCELLED, EVENT_STATUS.FINISHED]
const LOCKED_STATUSES = [EVENT_STATUS.CANCELLED, EVENT_STATUS.FINISHED]

const badRequest = (message) => new AppError(message, 400)
const conflict = (message) => new AppError(message, 409)

const lockedLabel = (status) => (status === EVENT_STATUS.CANCELLED ? 'cancelado' : 'finalizado')

// Reglas de negocio sobre los datos de un evento (ya filtrados y validados por el DTO de entrada)
const assertValidEventData = ({ date, capacity, price }) => {
  if (date !== undefined && date <= new Date()) {
    throw badRequest('La fecha del evento debe ser futura')
  }
  if (capacity !== undefined && capacity <= 0) {
    throw badRequest(ERROR_MESSAGES.invalidCapacity)
  }
  if (price !== undefined && price < 0) {
    throw badRequest(ERROR_MESSAGES.invalidPrice)
  }
}

export class EventsService {
  constructor (repository, tickets) {
    this.repository = repository
    this.tickets = tickets
  }

  // query: EventQueryDTO. Los borradores no son públicos: el listado nunca los incluye
  async listEvents (query) {
    if (!PUBLIC_STATUSES.includes(query.status)) {
      throw badRequest(`Estado inválido. Valores permitidos: ${PUBLIC_STATUSES.join(', ')}`)
    }

    const { page, limit, sort, ...criteria } = query
    const { events, total } = await this.repository.findPaginated(criteria, { sort, page, limit })

    return {
      data: events.map((event) => new EventDTO(event)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }

  async findEventOrFail (id) {
    const event = await this.repository.findById(id)

    if (!event) {
      throw new AppError(ERROR_MESSAGES.eventNotFound, 404)
    }

    return new EventDTO(event)
  }

  // Permisos sobre recursos propios: el organizer solo gestiona sus torneos y el admin cualquiera
  async getManageableEvent (id, user) {
    const event = await this.findEventOrFail(id)

    if (!canManageEvent(user, event)) {
      throw new AppError(ERROR_MESSAGES.eventForbidden, 403)
    }

    return event
  }

  // Los borradores solo los ve su organizer o un admin.
  // El detalle incluye los cupos disponibles, calculados con los tickets activos
  async getVisibleEvent (id, viewer) {
    const event = await this.findEventOrFail(id)

    if (event.status === EVENT_STATUS.DRAFT && !canManageEvent(viewer, event)) {
      throw new AppError(ERROR_MESSAGES.eventNotFound, 404)
    }

    const occupied = await this.tickets.countOccupiedSeats(event.id)
    event.availableSeats = Math.max(event.capacity - occupied, 0)
    return event
  }

  // data: CreateEventDTO. El organizer siempre es el usuario autenticado
  async createEvent (data, organizerId) {
    assertValidEventData(data)

    if (!CREATABLE_STATUSES.includes(data.status)) {
      throw badRequest(`Un evento nuevo solo puede crearse como ${CREATABLE_STATUSES.join(' o ')}`)
    }

    const event = await this.repository.createEvent({ ...data, organizer: organizerId })
    return new EventDTO(event)
  }

  // data: UpdateEventDTO
  async updateEvent (event, data) {
    if (LOCKED_STATUSES.includes(event.status)) {
      throw conflict(`No se puede modificar un evento ${lockedLabel(event.status)}`)
    }

    assertValidEventData(data)

    if (data.capacity !== undefined) {
      const occupied = await this.tickets.countOccupiedSeats(event.id)
      if (data.capacity < occupied) {
        throw conflict(`La capacidad no puede ser menor a los cupos ya ocupados (${occupied})`)
      }
    }

    const updated = await this.repository.updateEvent(event.id, { ...data })
    return new EventDTO(updated)
  }

  // status: viene de ChangeEventStatusDTO (ya es un estado válido)
  async changeStatus (event, status) {
    if (LOCKED_STATUSES.includes(event.status)) {
      throw conflict(`No se puede cambiar el estado de un evento ${lockedLabel(event.status)}`)
    }

    if (status === event.status) {
      throw conflict(`El evento ya está en estado ${status}`)
    }

    if (!EVENT_STATUS_TRANSITIONS[event.status].includes(status)) {
      throw conflict(`No se puede pasar un evento de ${event.status} a ${status}`)
    }

    const eventDate = new Date(event.date)

    if (status === EVENT_STATUS.PUBLISHED && eventDate <= new Date()) {
      throw conflict('No se puede publicar un evento cuya fecha ya pasó')
    }

    if (status === EVENT_STATUS.FINISHED && eventDate > new Date()) {
      throw conflict('No se puede finalizar un evento que todavía no ocurrió')
    }

    const updated = await this.repository.updateEvent(event.id, { status })
    return new EventDTO(updated)
  }
}

export const eventsService = new EventsService(eventRepository, ticketRepository)
