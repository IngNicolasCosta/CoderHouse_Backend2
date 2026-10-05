import { Router } from 'express'
import { register, login, current, logout } from '../controllers/sessions.controller.js'
import { validateRegister } from '../middlewares/validateRegister.middleware.js'
import { validateLogin } from '../middlewares/validateLogin.middleware.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'

const router = Router()

router.post('/register', validateRegister, register)
router.post('/login', validateLogin, login)
router.get('/current', authMiddleware, current)
router.post('/logout', logout)

export default router
