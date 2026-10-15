import { EVENT_STATUS } from '../../config/constants.js'
import { parseEventFields } from './event-fields.js'

// Datos de entrada para crear un evento (POST /api/events). El organizer no se
// acepta del body: lo asigna el service con el usuario autenticado
export class CreateEventDTO {
  constructor (body = {}) {
    Object.assign(this, parseEventFields(body))
    this.status = body.status ?? EVENT_STATUS.DRAFT
  }
}
