import { authCookie } from '../config/config.js'
import { generateToken } from '../utils/jwt.js'

export const register = (req, res) => {
  res.status(201).json({ status: 'success', payload: req.user })
}

export const login = (req, res) => {
  const token = generateToken(req.user)
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
