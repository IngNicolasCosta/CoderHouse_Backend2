import { EventModel } from '../models/Event.js'

class EventsDao {
  find (filter = {}) {
    return EventModel.find(filter).lean()
  }
}

export const eventsDao = new EventsDao()
