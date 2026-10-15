import { AppError } from './errors.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const PASSWORD_MIN_LENGTH = 8

export const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

export const isMissing = (value) => value === undefined || value === null || (typeof value === 'string' && value.trim() === '')

export const isValidEmail = (email) => EMAIL_REGEX.test(email)

export const normalizeEmail = (email) => email.trim().toLowerCase()

// Acepta números o textos numéricos ("12"); cualquier otra cosa devuelve NaN
export const toNumber = (value) =>
  typeof value === 'number' || (typeof value === 'string' && value.trim() !== '') ? Number(value) : NaN

export const parseDate = (value, field) => {
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : new Date(NaN)
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`Fecha inválida en ${field}`, 400)
  }
  return date
}
