import { usersService } from '../services/users.service.js'
import { ChangeRoleDTO } from '../dto/request/change-role.dto.js'

export const getUsers = async (req, res) => {
  const users = await usersService.getUsers()
  res.status(200).json({ status: 'success', payload: users })
}

export const changeUserRole = async (req, res) => {
  const { role } = new ChangeRoleDTO(req.body)
  const user = await usersService.changeRole(req.params.uid, role, req.user.id)
  res.status(200).json({ status: 'success', payload: user })
}
