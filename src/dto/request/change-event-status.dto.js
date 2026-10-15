import { EVENT_STATUS } from '../../config/constants.js'
import { AppError } from '../../utils/errors.js'

const STATUSES = Object.values(EVENT_STATUS)

// Estado de entrada para PATCH /api/events/:id/status
export class ChangeEventStatusDTO {
  constructor (body = {}) {
    if (!STATUSES.includes(body.status)) {
      throw new AppError(`Estado inválido. Valores permitidos: ${STATUSES.join(', ')}`, 400)
    }

    this.status = body.status
  }
}
