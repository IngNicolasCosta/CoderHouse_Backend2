import { usersRepository } from '../repositories/users.repository.js'
import { createHash } from '../utils/hash.js'
import { AppError } from '../utils/errors.js'
import { normalizeEmail } from '../utils/validators.js'

const DUPLICATE_KEY_ERROR = 11000

const toPublicUser = (user) => ({
  id: user._id,
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  role: user.role
})

class SessionsService {
  constructor (repository) {
    this.repository = repository
  }

  async register ({ first_name, last_name, email, password }) {
    const normalizedEmail = normalizeEmail(email)

    const existingUser = await this.repository.getByEmail(normalizedEmail)
    if (existingUser) {
      throw new AppError('El email ya está registrado', 409)
    }

    try {
      const newUser = await this.repository.create({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: normalizedEmail,
        password: await createHash(password),
        role: 'user'
      })

      return toPublicUser(newUser)
    } catch (error) {
      if (error.code === DUPLICATE_KEY_ERROR) {
        throw new AppError('El email ya está registrado', 409)
      }
      throw error
    }
  }
}

export const sessionsService = new SessionsService(usersRepository)
