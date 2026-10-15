import { AppError, ERROR_MESSAGES } from '../../utils/errors.js'
import { toNumber } from '../../utils/validators.js'

// Datos de entrada de una inscripción (POST /api/events/:eid/tickets): cantidad de cupos, 1 por defecto
export class CreateTicketDTO {
  constructor (body = {}) {
    if (body?.quantity === undefined) {
      this.quantity = 1
      return
    }

    const quantity = toNumber(body.quantity)
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new AppError(ERROR_MESSAGES.invalidQuantity, 400)
    }
    this.quantity = quantity
  }
}
