import { userRepository } from '../repositories/users.repository.js'
import { UserDTO } from '../dto/user.dto.js'
import { ROLES } from '../config/permissions.js'
import { AppError, ERROR_MESSAGES } from '../utils/errors.js'

class UsersService {
  constructor (repository) {
    this.repository = repository
  }

  async getUsers () {
    const users = await this.repository.findAll()
    return users.map((user) => new UserDTO(user))
  }

  async changeRole (userId, role, requesterId) {
    if (!Object.values(ROLES).includes(role)) {
      throw new AppError(ERROR_MESSAGES.invalidRole, 400)
    }

    if (userId === requesterId) {
      throw new AppError(ERROR_MESSAGES.ownRoleChange, 400)
    }

    const user = await this.repository.updateRole(userId, role)

    if (!user) {
      throw new AppError(ERROR_MESSAGES.userNotFound, 404)
    }

    return new UserDTO(user)
  }
}

export const usersService = new UsersService(userRepository)
