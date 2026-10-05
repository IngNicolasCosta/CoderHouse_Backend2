import { eventsDao } from '../dao/events.dao.js'

class EventsRepository {
  constructor (dao) {
    this.dao = dao
  }

  async getPaginated (filter, { sort, page, limit }) {
    const [events, total] = await Promise.all([
      this.dao.find(filter, { sort, skip: (page - 1) * limit, limit }),
      this.dao.count(filter)
    ])
    return { events, total }
  }

  getById (id) {
    return this.dao.findById(id)
  }

  create (data) {
    return this.dao.create(data)
  }

  update (id, data) {
    return this.dao.updateById(id, data)
  }
}

export const eventsRepository = new EventsRepository(eventsDao)
