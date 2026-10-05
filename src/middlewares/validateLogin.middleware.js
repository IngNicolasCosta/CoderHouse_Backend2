import { AppError } from '../utils/errors.js'
import { isNonEmptyString } from '../utils/validators.js'

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body ?? {}

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    throw new AppError('Email y contraseña son obligatorios', 400)
  }

  next()
}
