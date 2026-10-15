import { EventDAO } from '../dao/events.dao.js'

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const containsText = (value) => ({ $regex: escapeRegex(value), $options: 'i' })

// Traduce los criterios de búsqueda del dominio a un filtro de MongoDB.
// Los textos se escapan para que no se interpreten como expresión regular
const buildFilter = ({ status, category, location, search, dateFrom, dateTo }) => {
  const filter = { status }
  if (category) filter.category = category
  if (location) filter.location = containsText(location)
  if (search) filter.$or = [{ title: containsText(search) }, { description: containsText(search) }]
  if (dateFrom || dateTo) {
    filter.date = {}
    if (dateFrom) filter.date.$gte = dateFrom
    if (dateTo) filter.date.$lte = dateTo
  }
  return filter
}

export class EventRepository {
  constructor (dao = new EventDAO()) {
    this.dao = dao
  }

  findById (id) {
    return this.dao.findById(id)
  }

  // Listado paginado. _id desempata el orden para que la paginación sea estable
  async findPaginated (criteria, { sort, page, limit }) {
    const filter = buildFilter(criteria)
    const mongoSort = { [sort.field]: sort.direction === 'desc' ? -1 : 1, _id: 1 }

    const [events, total] = await Promise.all([
      this.dao.find(filter, { sort: mongoSort, skip: (page - 1) * limit, limit }),
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
