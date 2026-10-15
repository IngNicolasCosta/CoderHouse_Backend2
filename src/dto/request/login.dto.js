import { AppError, ERROR_MESSAGES } from '../../utils/errors.js'
import { isNonEmptyString, normalizeEmail } from '../../utils/validators.js'

// Credenciales de entrada del login: email normalizado y contraseña
export class LoginDTO {
  constructor (body = {}) {
    if (!isNonEmptyString(body.email) || !isNonEmptyString(body.password)) {
      throw new AppError(ERROR_MESSAGES.missingCredentials, 400)
    }

    this.email = normalizeEmail(body.email)
    this.password = body.password
  }
}
