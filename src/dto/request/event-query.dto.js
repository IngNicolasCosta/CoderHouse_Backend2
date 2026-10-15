import { EVENT_CATEGORIES, EVENT_SORT_FIELDS, EVENT_STATUS, PAGINATION } from '../../config/constants.js'
import { AppError } from '../../utils/errors.js'
import { isMissing, parseDate, toNumber } from '../../utils/validators.js'

const QUERY_PARAMS = ['status', 'category', 'location', 'search', 'dateFrom', 'dateTo', 'page', 'limit', 'sort']
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/

const badRequest = (message) => new AppError(message, 400)

const parsePositiveInt = (value, defaultValue, field) => {
  if (isMissing(value)) return defaultValue
  const number = toNumber(value)
  if (!Number.isInteger(number) || number < 1) {
    throw badRequest(`El parámetro ${field} debe ser un número entero mayor a 0`)
  }
  return number
}

// Query params de GET /api/events: valida tipos y formatos y los convierte en
// criterios de búsqueda, paginación y orden independientes de MongoDB
export class EventQueryDTO {
  constructor (query = {}) {
    const invalidParam = QUERY_PARAMS.find((param) => query[param] !== undefined && typeof query[param] !== 'string')
    if (invalidParam) {
      throw badRequest(`Parámetro inválido: ${invalidParam}`)
    }

    this.status = query.status || EVENT_STATUS.PUBLISHED

    if (query.category && !EVENT_CATEGORIES.includes(query.category)) {
      throw badRequest(`Categoría inválida. Valores permitidos: ${EVENT_CATEGORIES.join(', ')}`)
    }
    this.category = query.category || undefined
    this.location = query.location || undefined
    this.search = query.search || undefined

    this.dateFrom = query.dateFrom ? parseDate(query.dateFrom, 'dateFrom') : undefined
    this.dateTo = query.dateTo ? parseDate(query.dateTo, 'dateTo') : undefined
    // Si dateTo es solo una fecha (YYYY-MM-DD), se incluye el día completo
    if (this.dateTo && DATE_ONLY_REGEX.test(query.dateTo)) this.dateTo.setUTCHours(23, 59, 59, 999)
    if (this.dateFrom && this.dateTo && this.dateFrom > this.dateTo) {
      throw badRequest('dateFrom no puede ser posterior a dateTo')
    }

    const sort = query.sort || 'date'
    const sortField = sort.replace(/^-/, '')
    if (!EVENT_SORT_FIELDS.includes(sortField)) {
      throw badRequest(`Ordenamiento inválido. Campos permitidos: ${EVENT_SORT_FIELDS.join(', ')} (con - para descendente)`)
    }
    this.sort = { field: sortField, direction: sort.startsWith('-') ? 'desc' : 'asc' }

    this.page = parsePositiveInt(query.page, PAGINATION.defaultPage, 'page')
    this.limit = Math.min(parsePositiveInt(query.limit, PAGINATION.defaultLimit, 'limit'), PAGINATION.maxLimit)
  }
}
