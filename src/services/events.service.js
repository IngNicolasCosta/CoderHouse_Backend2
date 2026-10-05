import mongoose from 'mongoose'
import { eventsRepository } from '../repositories/events.repository.js'
import { AppError, ERROR_MESSAGES } from '../utils/errors.js'

// Campos que el cliente puede enviar; organizer nunca se toma del body
const EDITABLE_FIELDS = ['title', 'description', 'division', 'gender', 'date', 'location', 'capacity', 'status']

const pickEditableFields = (data = {}) =>
  Object.fromEntries(EDITABLE_FIELDS.filter((field) => data[field] !== undefined).map((field) => [field, data[field]]))

const toEventResponse = (event) => ({
  id: event._id.toString(),
  title: event.title,
  description: event.description,
  division: event.division,
  gender: event.gender,
  date: event.date,
  location: event.location,
  capacity: event.capacity,
  status: event.status,
  organizer: event.organizer.toString()
})

class EventsService {
  constructor (repository) {
    this.repository = repository
  }

  async getPublishedEvents () {
    const events = await this.repository.getPublished()
    return events.map(toEventResponse)
  }

  async getEventById (id) {
    const event = mongoose.isValidObjectId(id) ? await this.repository.getById(id) : null

    if (!event) {
      throw new AppError(ERROR_MESSAGES.eventNotFound, 404)
    }

    return toEventResponse(event)
  }

  async createEvent (data, organizerId) {
    const event = await this.repository.create({ ...pickEditableFields(data), organizer: organizerId })
    return toEventResponse(event)
  }

  async updateEvent (id, data) {
    const event = await this.repository.update(id, pickEditableFields(data))
    return toEventResponse(event)
  }

  async cancelEvent (id) {
    const event = await this.repository.update(id, { status: 'cancelled' })
    return toEventResponse(event)
  }
}

export const eventsService = new EventsService(eventsRepository)
