import { EventModel } from '../models/Event.js'

class EventsDao {
  find (filter = {}) {
    return EventModel.find(filter).lean()
  }

  findById (id) {
    return EventModel.findById(id).lean()
  }

  async create (data) {
    const event = await EventModel.create(data)
    return event.toObject()
  }

  updateById (id, data) {
    return EventModel.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true }).lean()
  }
}

export const eventsDao = new EventsDao()
