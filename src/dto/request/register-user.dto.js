import { AppError, ERROR_MESSAGES } from '../../utils/errors.js'
import { PASSWORD_MIN_LENGTH, isNonEmptyString, isValidEmail, normalizeEmail } from '../../utils/validators.js'

const REQUIRED_FIELDS = ['first_name', 'last_name', 'email', 'password']

// Datos de entrada del registro: solo toma los 4 campos permitidos (cualquier otro,
// como role, se descarta), valida su formato y normaliza nombre y email
export class RegisterUserDTO {
  constructor (body = {}) {
    if (!REQUIRED_FIELDS.every((field) => isNonEmptyString(body[field]))) {
      throw new AppError(ERROR_MESSAGES.missingFields, 400)
    }

    if (!isValidEmail(body.email.trim())) {
      throw new AppError(ERROR_MESSAGES.invalidEmail, 400)
    }

    if (body.password.length < PASSWORD_MIN_LENGTH) {
      throw new AppError(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`, 400)
    }

    this.first_name = body.first_name.trim()
    this.last_name = body.last_name.trim()
    this.email = normalizeEmail(body.email)
    this.password = body.password
  }
}
