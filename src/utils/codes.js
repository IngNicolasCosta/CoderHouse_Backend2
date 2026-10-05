import { randomInt } from 'node:crypto'

// Sin caracteres que se confunden al leerlos (0/O, 1/I/L)
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

export const generateReservationCode = () => {
  const chars = Array.from({ length: CODE_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)])
  return `VOL-${chars.join('')}`
}
