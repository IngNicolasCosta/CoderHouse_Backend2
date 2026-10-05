import { authCookie } from '../config/config.js'
import { AppError } from '../utils/errors.js'
import { verifyToken } from '../utils/jwt.js'

export const authMiddleware = (req, res, next) => {
  const token = req.cookies?.[authCookie.name]

  if (!token) {
    throw new AppError('No autenticado', 401)
  }

  try {
    const { id, email, role } = verifyToken(token)
    req.user = { id, email, role }
  } catch {
    throw new AppError('No autenticado', 401)
  }

  next()
}
