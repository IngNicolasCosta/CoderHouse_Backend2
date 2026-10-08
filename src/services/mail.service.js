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

// Datos del torneo e inscripción que se repiten en todos los emails
const ticketDetails = (event, ticket) => [
  ['Liga', event.category],
  ['Fecha', formatDate(event.date)],
  ['Sede', event.location],
  ['Cupos', ticket.quantity],
  ['Código de reserva', ticket.reservationCode]
]

const buildEmail = ({ title, intro, details }) => ({
  text: [intro, ...details.map(([label, value]) => `${label}: ${value}`)].join('\n'),
  html: `
    <h1>🏐 ${escapeHtml(title)}</h1>
    <p>${escapeHtml(intro)}</p>
    <ul>
      ${details.map(([label, value]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`).join('\n      ')}
    </ul>
  `
})

class MailService {
  async send ({ to, subject, title, intro, details }) {
    if (!transporter) {
      console.warn(`Email no configurado (falta MAIL_HOST): se omite el email "${subject}"`)
      return
    }

    const info = await transporter.sendMail({
      from: config.mail.from,
      to,
      subject,
      ...buildEmail({ title, intro, details })
    })

    // Con una casilla de prueba (Ethereal) se muestra el link para ver el email enviado
    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) console.info(`Vista previa del email: ${previewUrl}`)
  }

  sendTicketConfirmation ({ to, name, event, ticket }) {
    return this.send({
      to,
      subject: `Inscripción confirmada: ${event.title}`,
      title: 'Inscripción confirmada',
      intro: `Hola ${name}, tu inscripción a ${event.title} quedó confirmada.`,
      details: ticketDetails(event, ticket)
    })
  }

  sendTicketCancellation ({ to, name, event, ticket, cancelledByAdmin }) {
    const reason = cancelledByAdmin
      ? 'fue cancelada por la administración de la liga'
      : 'quedó cancelada'

    return this.send({
      to,
      subject: `Inscripción cancelada: ${event.title}`,
      title: 'Inscripción cancelada',
      intro: `Hola ${name}, tu inscripción a ${event.title} ${reason}. Los cupos reservados quedaron liberados.`,
      details: ticketDetails(event, ticket)
    })
  }
}

export const mailService = new MailService()
