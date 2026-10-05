import { EventDAO } from '../dao/events.dao.js'

export class EventRepository {
  constructor (dao = new EventDAO()) {
    this.dao = dao
  }

  findById (id) {
    return this.dao.findById(id)
  }

  async findPaginated (filter, { sort, page, limit }) {
    const [events, total] = await Promise.all([
      this.dao.find(filter, { sort, skip: (page - 1) * limit, limit }),
      this.dao.count(filter)
    ])
    return { events, total }
  }

  createEvent (data) {
    return this.dao.create(data)
  }

  updateEvent (id, data) {
    return this.dao.update(id, data)
  }
}

export const eventRepository = new EventRepository()
