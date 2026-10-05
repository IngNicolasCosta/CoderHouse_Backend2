import passport from 'passport'
import { AppError, ERROR_MESSAGES } from '../utils/errors.js'

// Ejecuta una estrategia de Passport sin sesiones y, si falla, deriva el error al
// errorHandler para responder siempre con el formato JSON de la API
export const passportCall = (strategy, badRequestMessage = ERROR_MESSAGES.missingFields) =>
  (req, res, next) => {
    passport.authenticate(strategy, { session: false }, (error, user, info, status) => {
      if (error) return next(error)

      if (!user) {
        if (info instanceof AppError) return next(info)
        return next(status === 400
          ? new AppError(badRequestMessage, 400)
          : new AppError(ERROR_MESSAGES.unauthenticated, 401))
      }

      req.user = user
      next()
    })(req, res, next)
  }
