import { userRepository } from '../repositories/users.repository.js'
import { UserDTO } from '../dto/response/user.dto.js'
import { AppError, ERROR_MESSAGES } from '../utils/errors.js'

export class UsersService {
  constructor (repository) {
    this.repository = repository
  }

  async getUsers () {
    const users = await this.repository.findAll()
    return users.map((user) => new UserDTO(user))
  }

  // role: viene de ChangeRoleDTO (ya es un rol válido)
  async changeRole (userId, role, requesterId) {
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
