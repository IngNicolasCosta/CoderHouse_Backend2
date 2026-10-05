import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import { Strategy as JwtStrategy } from 'passport-jwt'
import { config, authCookie } from './config.js'
import { sessionsService } from '../services/sessions.service.js'
import { AppError } from '../utils/errors.js'
import { JWT_ALGORITHM } from '../utils/jwt.js'
import { validateLoginData, validateRegisterData } from '../utils/validators.js'

// Los errores esperados (AppError) se informan como fallo de autenticación con su
// mensaje y código; cualquier otro error se propaga como error interno
const failOrError = (error, done) =>
  error instanceof AppError ? done(null, false, error) : done(error)

const cookieExtractor = (req) => req?.cookies?.[authCookie.name] ?? null

// Las estrategias locales leen siempre req.body: passport-local también acepta
// credenciales por query string y no queremos contraseñas en la URL
const localOptions = { usernameField: 'email', passReqToCallback: true }

const registerStrategy = () => new LocalStrategy(localOptions, async (req, email, password, done) => {
  try {
    validateRegisterData(req.body)
    const user = await sessionsService.register(req.body)
    done(null, user)
  } catch (error) {
    failOrError(error, done)
  }
})

const loginStrategy = () => new LocalStrategy(localOptions, async (req, email, password, done) => {
  try {
    validateLoginData(req.body)
    const user = await sessionsService.validateCredentials(req.body)
    done(null, user)
  } catch (error) {
    failOrError(error, done)
  }
})

const currentStrategy = () => new JwtStrategy(
  {
    jwtFromRequest: cookieExtractor,
    secretOrKey: config.jwtSecret,
    algorithms: [JWT_ALGORITHM]
  },
  async (payload, done) => {
    try {
      const user = await sessionsService.getSessionUser(payload.id)
      done(null, user ?? false)
    } catch (error) {
      done(error)
    }
  }
)

// Para sumar un provider externo (Google, GitHub, etc.) alcanza con crear su
// estrategia y agregarla a esta lista; app.js no cambia
const strategies = {
  register: registerStrategy,
  login: loginStrategy,
  current: currentStrategy
}

export const initializePassport = () => {
  Object.entries(strategies).forEach(([name, createStrategy]) => {
    passport.use(name, createStrategy())
  })

  return passport.initialize()
}
