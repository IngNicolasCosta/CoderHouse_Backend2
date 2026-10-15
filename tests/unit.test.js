import './env.js'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { RegisterUserDTO } from '../src/dto/request/register-user.dto.js'
import { CreateEventDTO } from '../src/dto/request/create-event.dto.js'
import { EventQueryDTO } from '../src/dto/request/event-query.dto.js'
import { CreateTicketDTO } from '../src/dto/request/create-ticket.dto.js'
import { CurrentUserDTO } from '../src/dto/response/user.dto.js'
import { TicketDTO } from '../src/dto/response/ticket.dto.js'
import { SessionsService } from '../src/services/sessions.service.js'
import { EventsService } from '../src/services/events.service.js'
import { EventRepository } from '../src/repositories/events.repository.js'

// Tests sin base de datos: DTOs y capas con dependencias falsas en memoria.
// Que los services funcionen así muestra que no dependen de Mongoose

const rejectsWith = (promise, statusCode) => assert.rejects(promise, (error) => error.statusCode === statusCode)

describe('DTOs de entrada: filtran, validan y adaptan lo que llega a la API', () => {
  it('RegisterUserDTO descarta campos no permitidos (role) y normaliza los datos', () => {
    const dto = new RegisterUserDTO({ first_name: ' Ana ', last_name: 'Pérez', email: ' Ana@Mail.COM ', password: 'Secreta123', role: 'admin' })

    assert.deepEqual({ ...dto }, { first_name: 'Ana', last_name: 'Pérez', email: 'ana@mail.com', password: 'Secreta123' })
  })

  it('RegisterUserDTO rechaza datos inválidos con 400', () => {
    assert.throws(() => new RegisterUserDTO({ email: 'a@a.com' }), { statusCode: 400 })
    assert.throws(() => new RegisterUserDTO({ first_name: 'A', last_name: 'B', email: { $ne: null }, password: 'Secreta123' }), { statusCode: 400 })
  })

  it('CreateEventDTO convierte tipos, ignora organizer y pone draft por defecto', () => {
    const dto = new CreateEventDTO({
      title: ' Torneo ', description: 'x', category: 'A-femenino', date: '2030-01-10T18:00:00Z',
      location: 'Club', capacity: '12', price: '500', organizer: 'otro-usuario'
    })

    assert.equal(dto.title, 'Torneo')
    assert.equal(dto.capacity, 12)
    assert.equal(dto.price, 500)
    assert.ok(dto.date instanceof Date)
    assert.equal(dto.status, 'draft')
    assert.equal('organizer' in dto, false)
  })

  it('EventQueryDTO convierte los query params en criterios independientes de MongoDB', () => {
    const dto = new EventQueryDTO({ category: 'B-masculino', page: '2', limit: '500', sort: '-price', dateTo: '2030-05-01' })

    assert.equal(dto.page, 2)
    assert.equal(dto.limit, 50)
    assert.deepEqual(dto.sort, { field: 'price', direction: 'desc' })
    assert.equal(dto.dateTo.toISOString(), '2030-05-01T23:59:59.999Z')
    assert.throws(() => new EventQueryDTO({ sort: 'password' }), { statusCode: 400 })
  })

  it('CreateTicketDTO usa 1 cupo por defecto y rechaza cantidades inválidas', () => {
    assert.equal(new CreateTicketDTO(undefined).quantity, 1)
    assert.equal(new CreateTicketDTO({ quantity: '3' }).quantity, 3)
    assert.throws(() => new CreateTicketDTO({ quantity: 0 }), { statusCode: 400 })
  })
})

describe('DTOs de salida: nunca exponen datos sensibles', () => {
  it('CurrentUserDTO solo tiene id, email y role', () => {
    const dto = new CurrentUserDTO({ _id: 'u1', first_name: 'Ana', email: 'ana@mail.com', role: 'user', password: '$2b$10$hash', __v: 0 })
    assert.deepEqual({ ...dto }, { id: 'u1', email: 'ana@mail.com', role: 'user' })
  })

  it('TicketDTO filtra también el usuario traído con populate', () => {
    const dto = new TicketDTO({
      _id: 't1',
      event: 'e1',
      user: { _id: 'u1', first_name: 'Ana', last_name: 'P', email: 'ana@mail.com', password: '$2b$10$hash', role: 'user' },
      quantity: 1,
      status: 'confirmed',
      reservationCode: 'VOL-ABC123'
    })

    assert.deepEqual({ ...dto.user }, { id: 'u1', first_name: 'Ana', last_name: 'P', email: 'ana@mail.com' })
    assert.doesNotMatch(JSON.stringify(dto), /password|\$2b\$/)
  })
})

describe('Capas desacopladas: services y repositories con dependencias falsas', () => {
  it('SessionsService registra con un repository en memoria y responde un DTO sin password', async () => {
    const saved = []
    const fakeRepository = {
      findByEmail: async (email) => saved.find((user) => user.email === email) ?? null,
      createUser: async (data) => { const user = { _id: `u${saved.length + 1}`, ...data }; saved.push(user); return user }
    }
    const service = new SessionsService(fakeRepository)
    const data = new RegisterUserDTO({ first_name: 'Ana', last_name: 'P', email: 'ana@mail.com', password: 'Secreta123' })

    const user = await service.register(data)

    assert.deepEqual(Object.keys(user), ['id', 'first_name', 'last_name', 'email', 'role'])
    assert.match(saved[0].password, /^\$2b\$10\$/)
    assert.notEqual(saved[0].password, 'Secreta123')
    await rejectsWith(service.register(data), 409)
  })

  it('EventsService aplica las reglas de negocio sin tocar la base de datos', async () => {
    const created = []
    const fakeEvents = { createEvent: async (data) => { const event = { _id: 'e1', ...data }; created.push(event); return event } }
    const service = new EventsService(fakeEvents, { countOccupiedSeats: async () => 0 })
    const base = { title: 'T', description: 'x', category: 'A-femenino', location: 'Club', capacity: 10 }

    await rejectsWith(service.createEvent(new CreateEventDTO({ ...base, date: '2020-01-01' }), 'org1'), 400)
    await rejectsWith(service.createEvent(new CreateEventDTO({ ...base, date: '2030-01-01', capacity: 0 }), 'org1'), 400)

    const event = await service.createEvent(new CreateEventDTO({ ...base, date: '2030-01-01', status: 'published' }), 'org1')
    assert.equal(event.organizer, 'org1')
    assert.equal(created.length, 1)
  })

  it('EventRepository traduce los criterios del dominio a una consulta del DAO', async () => {
    let received
    const fakeDao = {
      find: async (filter, options) => { received = { filter, options }; return [] },
      count: async () => 0
    }
    const repository = new EventRepository(fakeDao)

    await repository.findPaginated(
      { status: 'published', location: 'club (norte)' },
      { sort: { field: 'date', direction: 'asc' }, page: 3, limit: 5 }
    )

    assert.deepEqual(received.filter, { status: 'published', location: { $regex: 'club \\(norte\\)', $options: 'i' } })
    assert.deepEqual(received.options, { sort: { date: 1, _id: 1 }, skip: 10, limit: 5 })
  })
})
