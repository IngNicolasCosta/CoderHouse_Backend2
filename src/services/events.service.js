import mongoose from 'mongoose'
import { eventsRepository } from '../repositories/events.repository.js'
import { ticketsRepository } from '../repositories/tickets.repository.js'
import {
  EVENT_CATEGORIES,
  EVENT_SORT_FIELDS,
  EVENT_STATUS,
  EVENT_STATUS_TRANSITIONS,
  PAGINATION
} from '../config/constants.js'
import { canManageEvent } from '../config/permissions.js'
import { AppError, ERROR_MESSAGES } from '../utils/errors.js'

const REQUIRED_FIELDS = ['title', 'description', 'category', 'date', 'location', 'capacity']
// Campos que el cliente puede enviar al crear o modificar; organizer y status nunca se toman de acá
const EDITABLE_FIELDS = [...REQUIRED_FIELDS, 'price']
const TEXT_FIELDS = ['title', 'description', 'location']
const QUERY_PARAMS = ['status', 'category', 'location', 'search', 'dateFrom', 'dateTo', 'page', 'limit', 'sort']

const CREATABLE_STATUSES = [EVENT_STATUS.DRAFT, EVENT_STATUS.PUBLISHED]
const PUBLIC_STATUSES = [EVENT_STATUS.PUBLISHED, EVENT_STATUS.CANCELLED, EVENT_STATUS.FINISHED]
const LOCKED_STATUSES = [EVENT_STATUS.CANCELLED, EVENT_STATUS.FINISHED]
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/

const badRequest = (message) => new AppError(message, 400)
const conflict = (message) => new AppError(message, 409)

const isMissing = (value) => value === undefined || value === null || (typeof value === 'string' && value.trim() === '')

const toNumber = (value) =>
  typeof value === 'number' || (typeof value === 'string' && value.trim() !== '') ? Number(value) : NaN

const parseDate = (value, field) => {
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : new Date(NaN)
  if (Number.isNaN(date.getTime())) {
    throw badRequest(`Fecha inválida en ${field}`)
  }
  return date
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const toEventResponse = (event) => ({
  id: event._id.toString(),
  title: event.title,
  description: event.description,
  category: event.category,
  date: event.date,
  location: event.location,
  capacity: event.capacity,
  price: event.price,
  status: event.status,
  organizer: event.organizer.toString()
})

// Valida y normaliza los datos de un evento. Con partial solo valida los campos enviados (PUT)
const buildEventData = (input = {}, { partial = false } = {}) => {
  const data = Object.fromEntries(
    EDITABLE_FIELDS.filter((field) => input[field] !== undefined).map((field) => [field, input[field]])
  )

  if (partial && Object.keys(data).length === 0) {
    throw badRequest('No hay campos para actualizar')
  }

  const missing = (partial ? Object.keys(data) : REQUIRED_FIELDS).filter((field) => isMissing(data[field]))
  if (missing.length > 0) {
    throw badRequest(`Faltan campos obligatorios: ${missing.join(', ')}`)
  }

  TEXT_FIELDS.filter((field) => data[field] !== undefined).forEach((field) => {
    if (typeof data[field] !== 'string') {
      throw badRequest(`El campo ${field} debe ser un texto`)
    }
    data[field] = data[field].trim()
  })

  if (data.category !== undefined && !EVENT_CATEGORIES.includes(data.category)) {
    throw badRequest(`Categoría inválida. Valores permitidos: ${EVENT_CATEGORIES.join(', ')}`)
  }

  if (data.date !== undefined) {
    data.date = parseDate(data.date, 'date')
    if (data.date <= new Date()) {
      throw badRequest('La fecha del evento debe ser futura')
    }
  }

  if (data.capacity !== undefined) {
    data.capacity = toNumber(data.capacity)
    if (!Number.isInteger(data.capacity) || data.capacity <= 0) {
      throw badRequest('La capacidad debe ser un número entero mayor a 0')
    }
  }

  if (data.price !== undefined) {
    data.price = toNumber(data.price)
    if (!Number.isFinite(data.price) || data.price < 0) {
      throw badRequest('El precio debe ser un número mayor o igual a 0')
    }
  }

  return data
}

const parsePositiveInt = (value, defaultValue, field) => {
  if (isMissing(value)) return defaultValue
  const number = toNumber(value)
  if (!Number.isInteger(number) || number < 1) {
    throw badRequest(`El parámetro ${field} debe ser un número entero mayor a 0`)
  }
  return number
}

const buildListFilter = ({ status, category, location, search, dateFrom, dateTo }) => {
  const filter = { status: status || EVENT_STATUS.PUBLISHED }

  if (!PUBLIC_STATUSES.includes(filter.status)) {
    throw badRequest(`Estado inválido. Valores permitidos: ${PUBLIC_STATUSES.join(', ')}`)
  }

  if (category) {
    if (!EVENT_CATEGORIES.includes(category)) {
      throw badRequest(`Categoría inválida. Valores permitidos: ${EVENT_CATEGORIES.join(', ')}`)
    }
    filter.category = category
  }

  if (location) {
    filter.location = { $regex: escapeRegex(location), $options: 'i' }
  }

  if (search) {
    const regex = { $regex: escapeRegex(search), $options: 'i' }
    filter.$or = [{ title: regex }, { description: regex }]
  }

  if (dateFrom || dateTo) {
    filter.date = {}
    if (dateFrom) filter.date.$gte = parseDate(dateFrom, 'dateFrom')
    if (dateTo) {
      const to = parseDate(dateTo, 'dateTo')
      // Si dateTo es solo una fecha (YYYY-MM-DD), se incluye el día completo
      if (DATE_ONLY_REGEX.test(dateTo)) to.setUTCHours(23, 59, 59, 999)
      filter.date.$lte = to
    }
    if (filter.date.$gte && filter.date.$lte && filter.date.$gte > filter.date.$lte) {
      throw badRequest('dateFrom no puede ser posterior a dateTo')
    }
  }

  return filter
}

const buildSort = (sort) => {
  const value = sort || 'date'
  const field = value.replace(/^-/, '')

  if (!EVENT_SORT_FIELDS.includes(field)) {
    throw badRequest(`Ordenamiento inválido. Campos permitidos: ${EVENT_SORT_FIELDS.join(', ')} (con - para descendente)`)
  }

  // _id como desempate para que la paginación sea estable
  return { [field]: value.startsWith('-') ? -1 : 1, _id: 1 }
}

class EventsService {
  constructor (repository) {
    this.repository = repository
  }

  async listEvents (query = {}) {
    const invalidParam = QUERY_PARAMS.find((param) => query[param] !== undefined && typeof query[param] !== 'string')
    if (invalidParam) {
      throw badRequest(`Parámetro inválido: ${invalidParam}`)
    }

    const filter = buildListFilter(query)
    const sort = buildSort(query.sort)
    const page = parsePositiveInt(query.page, PAGINATION.defaultPage, 'page')
    const limit = Math.min(parsePositiveInt(query.limit, PAGINATION.defaultLimit, 'limit'), PAGINATION.maxLimit)

    const { events, total } = await this.repository.getPaginated(filter, { sort, page, limit })

    return {
      data: events.map(toEventResponse),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }

  async findEventOrFail (id) {
    const event = mongoose.isValidObjectId(id) ? await this.repository.getById(id) : null

    if (!event) {
      throw new AppError(ERROR_MESSAGES.eventNotFound, 404)
    }

    return toEventResponse(event)
  }

  // Los borradores no son públicos: solo los ve su organizer o un admin.
  // El detalle incluye los cupos disponibles, calculados con los tickets activos
  async getVisibleEvent (id, viewer) {
    const event = await this.findEventOrFail(id)

    if (event.status === EVENT_STATUS.DRAFT && !canManageEvent(viewer, event)) {
      throw new AppError(ERROR_MESSAGES.eventNotFound, 404)
    }

    const occupied = await ticketsRepository.getOccupiedSeats(event.id)
    return { ...event, availableSeats: Math.max(event.capacity - occupied, 0) }
  }

  async createEvent (input = {}, organizerId) {
    const data = buildEventData(input)
    const status = input.status ?? EVENT_STATUS.DRAFT

    if (!CREATABLE_STATUSES.includes(status)) {
      throw badRequest(`Un evento nuevo solo puede crearse como ${CREATABLE_STATUSES.join(' o ')}`)
    }

    const event = await this.repository.create({ ...data, status, organizer: organizerId })
    return toEventResponse(event)
  }

  async updateEvent (event, input = {}) {
    if (LOCKED_STATUSES.includes(event.status)) {
      throw conflict(`No se puede modificar un evento ${event.status === EVENT_STATUS.CANCELLED ? 'cancelado' : 'finalizado'}`)
    }

    if (input.status !== undefined) {
      throw badRequest('El estado se cambia con PATCH /api/events/:id/status')
    }

    const data = buildEventData(input, { partial: true })

    if (data.capacity !== undefined) {
      const occupied = await ticketsRepository.getOccupiedSeats(event.id)
      if (data.capacity < occupied) {
        throw conflict(`La capacidad no puede ser menor a los cupos ya ocupados (${occupied})`)
      }
    }

    const updated = await this.repository.update(event.id, data)
    return toEventResponse(updated)
  }

  async changeStatus (event, status) {
    if (!Object.values(EVENT_STATUS).includes(status)) {
      throw badRequest(`Estado inválido. Valores permitidos: ${Object.values(EVENT_STATUS).join(', ')}`)
    }

    if (LOCKED_STATUSES.includes(event.status)) {
      throw conflict(`No se puede cambiar el estado de un evento ${event.status === EVENT_STATUS.CANCELLED ? 'cancelado' : 'finalizado'}`)
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

    const updated = await this.repository.update(event.id, { status })
    return toEventResponse(updated)
  }
}

export const eventsService = new EventsService(eventsRepository)
