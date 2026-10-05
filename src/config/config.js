import dotenv from 'dotenv'

dotenv.config({ quiet: true })

const REQUIRED_ENV = ['MONGO_URL', 'JWT_SECRET']

export const config = {
  port: Number(process.env.PORT) || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUrl: process.env.MONGO_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10
}

export const authCookie = {
  name: 'currentUser',
  options: {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: 3600000
  }
}

export const validateEnv = () => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`)
  }
}
