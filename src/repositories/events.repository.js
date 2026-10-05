import { eventsDao } from '../dao/events.dao.js'

class EventsRepository {
  constructor (dao) {
    this.dao = dao
  }

  getPublished () {
    return this.dao.find({ status: 'published' })
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
