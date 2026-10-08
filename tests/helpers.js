import assert from 'node:assert/strict'
import { mock } from 'node:test'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'

// Se definen antes de cargar la app: dotenv no pisa variables que ya existen, así
// los tests nunca usan la base ni la cuenta de email configuradas en el .env real
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'secreto-solo-para-tests'
process.env.MAIL_HOST = ''

export const PASSWORD = 'Secreta123'

export const futureDate = (days = 30) => new Date(Date.now() + days * 86400000).toISOString()

export const eventData = (overrides = {}) => ({
  title: 'Torneo Apertura',
  description: 'Fecha 1 de la liga',
  category: 'A-femenino',
  date: futureDate(),
  location: 'Club Ferro',
  capacity: 10,
  price: 0,
  status: 'published',
  ...overrides
})

// Los emails se envían en segundo plano: espera a que el mock registre la llamada
export const waitForCalls = async (mockFn, expected, timeoutMs = 2000) => {
  const start = Date.now()
  while (mockFn.mock.callCount() < expected && Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  return mockFn.mock.callCount()
}

// Levanta la app contra un MongoDB en memoria (uno por archivo de tests) con el
// envío de emails reemplazado por mocks
export const startTestServer = async () => {
  const mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri('voley-test'))

  const [{ default: app }, { userRepository }, { mailService }] = await Promise.all([
    import('../src/app.js'),
    import('../src/repositories/users.repository.js'),
    import('../src/services/mail.service.js')
  ])
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()))

  const mails = {
    confirmation: mock.method(mailService, 'sendTicketConfirmation', async () => {}),
    cancellation: mock.method(mailService, 'sendTicketCancellation', async () => {})
  }

  const api = () => request(app)
  const agent = () => request.agent(app)

  const login = async (email) => {
    const session = agent()
    const res = await session.post('/api/sessions/login').send({ email, password: PASSWORD })
    assert.equal(res.status, 200, `no se pudo loguear ${email}`)
    return session
  }

  // Registra un usuario por la API, le asigna el rol y devuelve un agente con la sesión iniciada
  const createUser = async (name, role = 'user') => {
    const email = `${name}@mail.com`
    const res = await api().post('/api/sessions/register')
      .send({ first_name: name, last_name: 'Test', email, password: PASSWORD })
    assert.equal(res.status, 201, `no se pudo registrar ${email}`)

    if (role !== 'user') {
      await userRepository.updateRole(res.body.payload.id, role)
    }

    const session = await login(email)
    session.id = res.body.payload.id
    return session
  }

  const stop = async () => {
    mock.restoreAll()
    await mongoose.disconnect()
    await mongo.stop()
  }

  return { app, api, agent, login, createUser, mails, stop }
}
