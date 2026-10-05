import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializePassport } from './config/passport.config.js'
import healthRouter from './routes/health.router.js'
import eventsRouter from './routes/events.router.js'
import sessionsRouter from './routes/sessions.router.js'
import { notFound } from './middlewares/notFound.middleware.js'
import { errorHandler } from './middlewares/errorHandler.middleware.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(initializePassport())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/api/health', healthRouter)
app.use('/api/events', eventsRouter)
app.use('/api/sessions', sessionsRouter)

app.use(notFound)
app.use(errorHandler)

export default app
