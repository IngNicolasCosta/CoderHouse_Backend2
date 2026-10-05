import { config } from '../config/config.js'

// Manejador centralizado: todas las respuestas de error tienen el formato
// { status: 'error', message } con 400, 401, 403, 404, 409 o 500
export const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ status: 'error', message: 'El body no es un JSON válido' })
  }

  // Validaciones del schema de Mongoose que llegaran desde los DAO
  if (err.name === 'ValidationError' && err.errors) {
    const fields = Object.keys(err.errors).join(', ')
    return res.status(400).json({ status: 'error', message: `Datos inválidos en: ${fields}` })
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ status: 'error', message: `Dato inválido en: ${err.path}` })
  }

  const statusCode = err.statusCode || 500

  if (statusCode === 500) {
    console.error(err)
  }

  res.status(statusCode).json({
    status: 'error',
    message: statusCode === 500 && config.nodeEnv === 'production'
      ? 'Error interno del servidor'
      : err.message
  })
}
