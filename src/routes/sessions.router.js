import { Router } from 'express'
import { register, login, current, logout } from '../controllers/sessions.controller.js'
import { validateRegister } from '../middlewares/validateRegister.middleware.js'

const router = Router()

router.post('/register', validateRegister, register)
router.post('/login', login)
router.get('/current', current)
router.post('/logout', logout)

export default router
