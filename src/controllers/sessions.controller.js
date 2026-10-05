import { sessionsService } from '../services/sessions.service.js'
import { authCookie } from '../config/config.js'

export const register = async (req, res) => {
  const user = await sessionsService.register(req.body)
  res.status(201).json({ status: 'success', payload: user })
}

export const login = async (req, res) => {
  const token = await sessionsService.login(req.body)
  res
    .cookie(authCookie.name, token, authCookie.options)
    .status(200)
    .json({ status: 'success', message: 'Login correcto' })
}

export const current = (req, res) => {
  res.status(200).json({ status: 'success', payload: req.user })
}

export const logout = (req, res) => {
  res
    .clearCookie(authCookie.name, authCookie.options)
    .status(200)
    .json({ status: 'success', message: 'Sesión cerrada' })
}
