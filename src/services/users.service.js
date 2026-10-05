import mongoose from 'mongoose'
import { usersRepository } from '../repositories/users.repository.js'
import { ROLES } from '../config/permissions.js'
import { AppError, ERROR_MESSAGES } from '../utils/errors.js'

export const toPublicUser = (user) => ({
  id: user._id.toString(),
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  role: user.role
})

class UsersService {
  constructor (repository) {
    this.repository = repository
  }

  async getUsers () {
    const users = await this.repository.getAll()
    return users.map(toPublicUser)
  }

  async changeRole (userId, role, requesterId) {
    if (!Object.values(ROLES).includes(role)) {
      throw new AppError(ERROR_MESSAGES.invalidRole, 400)
    }

    if (userId === requesterId) {
      throw new AppError(ERROR_MESSAGES.ownRoleChange, 400)
    }

    const user = mongoose.isValidObjectId(userId) ? await this.repository.updateRole(userId, role) : null

    if (!user) {
      throw new AppError(ERROR_MESSAGES.userNotFound, 404)
    }

    return toPublicUser(user)
  }
}

export const usersService = new UsersService(usersRepository)
