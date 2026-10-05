import { usersService } from '../services/users.service.js'

export const getUsers = async (req, res) => {
  const users = await usersService.getUsers()
  res.status(200).json({ status: 'success', payload: users })
}

export const changeUserRole = async (req, res) => {
  const user = await usersService.changeRole(req.params.uid, req.body?.role, req.user.id)
  res.status(200).json({ status: 'success', payload: user })
}
