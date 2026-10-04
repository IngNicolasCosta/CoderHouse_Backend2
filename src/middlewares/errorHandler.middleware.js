import { config } from '../config/config.js'

export const errorHandler = (err, req, res, next) => {
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
