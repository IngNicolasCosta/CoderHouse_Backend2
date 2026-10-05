import { AppError, ERROR_MESSAGES } from './errors.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const REGISTER_FIELDS = ['first_name', 'last_name', 'email', 'password']

export const PASSWORD_MIN_LENGTH = 8

export const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

export const isValidEmail = (email) => EMAIL_REGEX.test(email)

export const normalizeEmail = (email) => email.trim().toLowerCase()

export const validateRegisterData = (data = {}) => {
  if (!REGISTER_FIELDS.every((field) => isNonEmptyString(data[field]))) {
    throw new AppError(ERROR_MESSAGES.missingFields, 400)
  }

  if (!isValidEmail(data.email.trim())) {
    throw new AppError(ERROR_MESSAGES.invalidEmail, 400)
  }

  if (data.password.length < PASSWORD_MIN_LENGTH) {
    throw new AppError(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`, 400)
  }
}

export const validateLoginData = (data = {}) => {
  if (!isNonEmptyString(data.email) || !isNonEmptyString(data.password)) {
    throw new AppError(ERROR_MESSAGES.missingCredentials, 400)
  }
}
