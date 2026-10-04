import { eventsRepository } from '../repositories/events.repository.js'

class EventsService {
  constructor (repository) {
    this.repository = repository
  }

  getEvents () {
    return this.repository.getAll()
  }
}

export const eventsService = new EventsService(eventsRepository)
