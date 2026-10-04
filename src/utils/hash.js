import bcrypt from 'bcrypt'
import { config } from '../config/config.js'

export const createHash = (password) => bcrypt.hash(password, config.bcryptSaltRounds)

export const isValidPassword = (password, hashedPassword) => bcrypt.compare(password, hashedPassword)
