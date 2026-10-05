import { EventModel } from '../models/Event.js'

class EventsDao {
  find (filter = {}, { sort, skip, limit } = {}) {
    return EventModel.find(filter).sort(sort).skip(skip).limit(limit).lean()
  }

  count (filter = {}) {
    return EventModel.countDocuments(filter)
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
