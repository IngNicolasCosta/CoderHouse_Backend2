import { AppError } from '../../utils/errors.js'
import { parseEventFields } from './event-fields.js'

// Datos de entrada para modificar un evento (PUT /api/events/:id): solo los campos enviados
export class UpdateEventDTO {
  constructor (body = {}) {
    if (body.status !== undefined) {
      throw new AppError('El estado se cambia con PATCH /api/events/:id/status', 400)
    }

    Object.assign(this, parseEventFields(body, { partial: true }))
  }
}
