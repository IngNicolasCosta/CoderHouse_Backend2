import { validateEnv } from '../config/config.js'
import { connectDB, disconnectDB } from '../config/database.js'
import { userRepository } from '../repositories/users.repository.js'
import { eventRepository } from '../repositories/events.repository.js'
import { ticketRepository } from '../repositories/tickets.repository.js'
import { sessionsService } from '../services/sessions.service.js'
import { eventsService } from '../services/events.service.js'
import { TicketsService } from '../services/tickets.service.js'
import { RegisterUserDTO } from '../dto/request/register-user.dto.js'
import { CreateEventDTO } from '../dto/request/create-event.dto.js'
import { CreateTicketDTO } from '../dto/request/create-ticket.dto.js'

// Uso: npm run seed
// Crea usuarios de prueba de los 3 roles y torneos de ejemplo pasando por los services y
// DTOs de la API (mismas validaciones y reglas). Se puede correr varias veces: lo que ya
// existe no se duplica

const SEED_PASSWORD = 'Voley2026'

// Mismo service de tickets que usa la API, pero sin notificaciones: los usuarios de
// prueba tienen emails ficticios (las dependencias se inyectan por constructor)
const silentTicketsService = new TicketsService(ticketRepository, {
  users: { findById: async () => ({ email: '', first_name: '' }) },
  events: eventsService,
  mail: { sendTicketConfirmation: async () => {}, sendTicketCancellation: async () => {} }
})

const SEED_USERS = [
  { first_name: 'Ana', last_name: 'Admin', email: 'admin@ligavoley.test', role: 'admin' },
  { first_name: 'Oscar', last_name: 'Organizador', email: 'organizador@ligavoley.test', role: 'organizer' },
  { first_name: 'Olga', last_name: 'Organizadora', email: 'organizadora@ligavoley.test', role: 'organizer' },
  { first_name: 'Julia', last_name: 'Jugadora', email: 'jugadora@ligavoley.test', role: 'user' },
  { first_name: 'Juan', last_name: 'Jugador', email: 'jugador@ligavoley.test', role: 'user' }
]

// Fecha futura relativa a hoy, a las 18:00 de Argentina (21:00 UTC)
const daysFromNow = (days) => {
  const date = new Date(Date.now() + days * 86400000)
  date.setUTCHours(21, 0, 0, 0)
  return date.toISOString()
}

const SEED_EVENTS = [
  ...[
    ['Torneo Apertura', 'A-femenino', 'Club Ferro', 12, 5000],
    ['Torneo Apertura', 'A-masculino', 'Club Ferro', 12, 5000],
    ['Copa de Invierno', 'B-femenino', 'Polideportivo Norte', 10, 4000],
    ['Copa de Invierno', 'B-masculino', 'Polideportivo Norte', 10, 4000],
    ['Liga de Ascenso', 'C-femenino', 'Club GEBA', 8, 3000],
    ['Liga de Ascenso', 'C-masculino', 'Club GEBA', 8, 3000],
    ['Torneo Desarrollo', 'D-femenino', 'Club Italiano', 16, 0],
    ['Torneo Desarrollo', 'E-masculino', 'Club Italiano', 16, 0]
  ].map(([title, category, location, capacity, price], index) => ({
    owner: 'organizador@ligavoley.test',
    title: `${title} ${category}`,
    description: `Torneo de la liga ${category} organizado por la liga de vóley`,
    category,
    location,
    capacity,
    price,
    date: daysFromNow(15 + index * 7),
    status: 'published'
  })),
  // Cupo 1 ya ocupado: sirve para probar la inscripción sin cupo
  { owner: 'organizador@ligavoley.test', title: 'Copa Relámpago', description: 'Torneo exprés con un solo cupo', category: 'A-femenino', location: 'Club Ferro', capacity: 1, price: 0, date: daysFromNow(30), status: 'published', fullBy: 'jugador@ligavoley.test' },
  // Borrador: no aparece en el listado público
  { owner: 'organizador@ligavoley.test', title: 'Torneo en preparación', description: 'Borrador, todavía no publicado', category: 'B-masculino', location: 'Club GEBA', capacity: 10, price: 0, date: daysFromNow(90), status: 'draft' },
  // De otro organizer: sirve para probar que un organizer no modifica eventos ajenos
  { owner: 'organizadora@ligavoley.test', title: 'Torneo de Primavera', description: 'Organizado por otra organizadora', category: 'E-femenino', location: 'Club Náutico', capacity: 20, price: 2500, date: daysFromNow(45), status: 'published' }
]

const seedUsers = async () => {
  const users = {}
  for (const { role, ...data } of SEED_USERS) {
    const existing = await userRepository.findByEmail(data.email)
    const user = existing ?? await sessionsService.register(new RegisterUserDTO({ ...data, password: SEED_PASSWORD }))
    const id = existing?._id.toString() ?? user.id
    await userRepository.updateRole(id, role)
    users[data.email] = { id, email: data.email, role }
    console.log(`  ${existing ? '=' : '+'} ${role.padEnd(9)} ${data.email}`)
  }
  return users
}

const seedEvents = async (users) => {
  for (const { owner, fullBy, ...data } of SEED_EVENTS) {
    const existing = await eventRepository.findByTitle(data.title)
    const event = existing
      ? { id: existing._id.toString() }
      : await eventsService.createEvent(new CreateEventDTO(data), users[owner].id)
    console.log(`  ${existing ? '=' : '+'} ${data.status.padEnd(9)} ${data.title}`)

    if (fullBy && !existing) {
      await silentTicketsService.createTicket(event.id, users[fullBy], new CreateTicketDTO({ quantity: data.capacity }))
    }
  }
}

const seed = async () => {
  validateEnv()
  await connectDB()

  console.log('Usuarios (+ creado, = ya existía):')
  const users = await seedUsers()
  console.log('Torneos:')
  await seedEvents(users)

  console.log(`\nListo. Todos los usuarios de prueba usan la contraseña: ${SEED_PASSWORD}`)
}

seed()
  .catch((error) => {
    console.error('No se pudo cargar el seed:', error.message)
    process.exitCode = 1
  })
  .finally(disconnectDB)
