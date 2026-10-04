import { sessionsService } from '../services/sessions.service.js'

const notImplemented = (res, feature) => {
  res.status(501).json({
    status: 'error',
    message: `${feature} todavía no está implementado`
  })
}

export const register = async (req, res) => {
  const user = await sessionsService.register(req.body)
  res.status(201).json({ status: 'success', payload: user })
}

export const login = (req, res) => notImplemented(res, 'El login')

export const current = (req, res) => notImplemented(res, 'La consulta del usuario actual')

export const logout = (req, res) => notImplemented(res, 'El logout')
