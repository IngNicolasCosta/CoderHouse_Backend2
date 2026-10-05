import nodemailer from 'nodemailer'
import { config } from '../config/config.js'
import { transporter } from '../config/mailer.config.js'

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

const formatDate = (date) => new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: 'America/Argentina/Buenos_Aires'
}).format(new Date(date))

class MailService {
  async sendTicketConfirmation ({ to, name, event, ticket }) {
    if (!transporter) {
      console.warn('Email no configurado (falta MAIL_HOST): se omite el email de confirmación')
      return
    }

    const date = formatDate(event.date)
    const info = await transporter.sendMail({
      from: config.mail.from,
      to,
      subject: `Inscripción confirmada: ${event.title}`,
      text: [
        `Hola ${name}, tu inscripción a ${event.title} quedó confirmada.`,
        `Liga: ${event.category}`,
        `Fecha: ${date}`,
        `Sede: ${event.location}`,
        `Cupos reservados: ${ticket.quantity}`,
        `Código de reserva: ${ticket.reservationCode}`
      ].join('\n'),
      html: `
        <h1>🏐 Inscripción confirmada</h1>
        <p>Hola ${escapeHtml(name)}, tu inscripción a <strong>${escapeHtml(event.title)}</strong> quedó confirmada.</p>
        <ul>
          <li><strong>Liga:</strong> ${escapeHtml(event.category)}</li>
          <li><strong>Fecha:</strong> ${escapeHtml(date)}</li>
          <li><strong>Sede:</strong> ${escapeHtml(event.location)}</li>
          <li><strong>Cupos reservados:</strong> ${ticket.quantity}</li>
        </ul>
        <p>Código de reserva: <strong>${escapeHtml(ticket.reservationCode)}</strong></p>
      `
    })

    // Con una casilla de prueba (Ethereal) se muestra el link para ver el email enviado
    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) console.info(`Vista previa del email: ${previewUrl}`)
  }
}

export const mailService = new MailService()
