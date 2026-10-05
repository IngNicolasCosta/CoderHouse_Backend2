import { usersRepository } from '../repositories/users.repository.js'
import { createHash, isValidPassword } from '../utils/hash.js'
import { AppError, ERROR_MESSAGES } from '../utils/errors.js'
import { normalizeEmail } from '../utils/validators.js'

const DUPLICATE_KEY_ERROR = 11000

// Hash de una contraseña aleatoria: se compara cuando el email no existe para que
// el tiempo de respuesta no revele si el usuario está registrado
const DUMMY_PASSWORD_HASH = '$2b$10$Lcoc7i4TDjZadwqK/Wij5eeQM5AX0xmNNkwprgqN5gLyoKM/uk2IS'

const toPublicUser = (user) => ({
  id: user._id.toString(),
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  role: user.role
})

const toSessionUser = (user) => ({
  id: user._id.toString(),
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
      throw new AppError(ERROR_MESSAGES.emailTaken, 409)
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
        throw new AppError(ERROR_MESSAGES.emailTaken, 409)
      }
      throw error
    }
  }

  async validateCredentials ({ email, password }) {
    const user = await this.repository.getByEmail(normalizeEmail(email))
    const passwordMatches = await isValidPassword(password, user?.password ?? DUMMY_PASSWORD_HASH)

    if (!user || !passwordMatches) {
      throw new AppError(ERROR_MESSAGES.invalidCredentials, 401)
    }

    return toSessionUser(user)
  }

  async getSessionUser (id) {
    const user = await this.repository.getById(id)
    return user ? toSessionUser(user) : null
  }
}

export const sessionsService = new SessionsService(usersRepository)
