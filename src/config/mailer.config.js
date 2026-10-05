import nodemailer from 'nodemailer'
import { config } from './config.js'

const { host, port, user, pass } = config.mail

// Sin MAIL_HOST no se crea el transporter: la API funciona igual y solo se omiten los emails
export const transporter = host
  ? nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user ? { user, pass } : undefined
  })
  : null
