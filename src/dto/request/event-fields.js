import { EVENT_CATEGORIES } from '../../config/constants.js'
import { AppError, ERROR_MESSAGES } from '../../utils/errors.js'
import { isMissing, parseDate, toNumber } from '../../utils/validators.js'

export const REQUIRED_EVENT_FIELDS = ['title', 'description', 'category', 'date', 'location', 'capacity']
// Campos que el cliente puede enviar; organizer y status nunca se toman de acá
const EDITABLE_EVENT_FIELDS = [...REQUIRED_EVENT_FIELDS, 'price']
const TEXT_FIELDS = ['title', 'description', 'location']

const badRequest = (message) => new AppError(message, 400)

// Filtra, valida el formato y adapta los campos de un evento. Con partial solo
// procesa los campos enviados (PUT). Las reglas de negocio (fecha futura, capacidad
// mayor a 0, precio no negativo) las aplica después EventsService
export const parseEventFields = (input = {}, { partial = false } = {}) => {
  const data = Object.fromEntries(
    EDITABLE_EVENT_FIELDS.filter((field) => input[field] !== undefined).map((field) => [field, input[field]])
  )

  if (partial && Object.keys(data).length === 0) {
    throw badRequest('No hay campos para actualizar')
  }

  const missing = (partial ? Object.keys(data) : REQUIRED_EVENT_FIELDS).filter((field) => isMissing(data[field]))
  if (missing.length > 0) {
    throw badRequest(`Faltan campos obligatorios: ${missing.join(', ')}`)
  }

  TEXT_FIELDS.filter((field) => data[field] !== undefined).forEach((field) => {
    if (typeof data[field] !== 'string') {
      throw badRequest(`El campo ${field} debe ser un texto`)
    }
    data[field] = data[field].trim()
  })

  if (data.category !== undefined && !EVENT_CATEGORIES.includes(data.category)) {
    throw badRequest(`Categoría inválida. Valores permitidos: ${EVENT_CATEGORIES.join(', ')}`)
  }

  if (data.date !== undefined) {
    data.date = parseDate(data.date, 'date')
  }

  if (data.capacity !== undefined) {
    data.capacity = toNumber(data.capacity)
    if (!Number.isInteger(data.capacity)) throw badRequest(ERROR_MESSAGES.invalidCapacity)
  }

  if (data.price !== undefined) {
    data.price = toNumber(data.price)
    if (!Number.isFinite(data.price)) throw badRequest(ERROR_MESSAGES.invalidPrice)
  }

  return data
}
