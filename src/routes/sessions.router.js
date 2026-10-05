import { Router } from 'express'
import { register, login, current, logout } from '../controllers/sessions.controller.js'
import { passportCall } from '../middlewares/auth.middleware.js'
import { ERROR_MESSAGES } from '../utils/errors.js'

const router = Router()

router.post('/register', passportCall('register'), register)
router.post('/login', passportCall('login', ERROR_MESSAGES.missingCredentials), login)
router.get('/current', passportCall('current'), current)
router.post('/logout', logout)

export default router
