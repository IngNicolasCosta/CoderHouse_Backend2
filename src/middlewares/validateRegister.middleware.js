import { AppError } from '../utils/errors.js'
import { PASSWORD_MIN_LENGTH, isNonEmptyString, isValidEmail } from '../utils/validators.js'

const REQUIRED_FIELDS = ['first_name', 'last_name', 'email', 'password']

export const validateRegister = (req, res, next) => {
  const body = req.body ?? {}

  if (!REQUIRED_FIELDS.every((field) => isNonEmptyString(body[field]))) {
    throw new AppError('Faltan campos obligatorios', 400)
  }

  if (!isValidEmail(body.email.trim())) {
    throw new AppError('El formato del email es inválido', 400)
  }

  if (body.password.length < PASSWORD_MIN_LENGTH) {
    throw new AppError(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`, 400)
  }

  next()
}
