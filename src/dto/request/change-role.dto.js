import { ROLES } from '../../config/permissions.js'
import { AppError, ERROR_MESSAGES } from '../../utils/errors.js'

// Rol de entrada para PATCH /api/users/:uid/role
export class ChangeRoleDTO {
  constructor (body = {}) {
    if (!Object.values(ROLES).includes(body.role)) {
      throw new AppError(ERROR_MESSAGES.invalidRole, 400)
    }

    this.role = body.role
  }
}
