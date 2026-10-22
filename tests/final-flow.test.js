import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startTestServer, eventData, futureDate, waitForCalls, PASSWORD } from './helpers.js'

// Los 10 casos del "Flujo completo a verificar" de la entrega final, en orden
describe('Entrega final: flujo completo a verificar', () => {
  let t, organizer, otherOrganizer, admin, user, otherUser, event

  const noPassword = (body) => assert.doesNotMatch(JSON.stringify(body), /password|\$2[aby]\$/)

  before(async () => {
    t = await startTestServer()
    organizer = await t.createUser('organizador', 'organizer')
    otherOrganizer = await t.createUser('organizadora', 'organizer')
    admin = await t.createUser('admin', 'admin')
    otherUser = await t.createUser('jugador')
  })
  after(() => t.stop())

  it('1. registro → login → /current → logout → /current devuelve 401', async () => {
    const register = await t.api().post('/api/sessions/register')
      .send({ first_name: 'Julia', last_name: 'Jugadora', email: 'jugadora@mail.com', password: PASSWORD })
    assert.equal(register.status, 201)

    user = await t.login('jugadora@mail.com')
    user.id = register.body.payload.id
    assert.equal((await user.get('/api/sessions/current')).status, 200)
    assert.equal((await user.post('/api/sessions/logout')).status, 200)
    assert.equal((await user.get('/api/sessions/current')).status, 401)

    user = await t.login('jugadora@mail.com')
  })

  it('2. un user intenta crear un evento → 403', async () => {
    const res = await user.post('/api/events').send(eventData())
    assert.equal(res.status, 403)
  })

  it('3. organizer crea evento → user se inscribe → email enviado → cupo descontado', async () => {
    const created = await organizer.post('/api/events').send(eventData({ title: 'Copa Final', capacity: 2 }))
    assert.equal(created.status, 201)
    event = created.body.payload

    const confirmationsBefore = t.mails.confirmation.mock.callCount()
    const ticket = await user.post(`/api/events/${event.id}/tickets`)
    assert.equal(ticket.status, 201)
    assert.equal(ticket.body.payload.status, 'confirmed')
    assert.equal(await waitForCalls(t.mails.confirmation, confirmationsBefore + 1), confirmationsBefore + 1)
    assert.equal(t.mails.confirmation.mock.calls.at(-1).arguments[0].to, 'jugadora@mail.com')

    const detail = await t.api().get(`/api/events/${event.id}`)
    assert.equal(detail.body.payload.availableSeats, 1)
  })

  it('4. el user intenta inscribirse de nuevo al mismo evento → 409 por duplicado', async () => {
    const res = await user.post(`/api/events/${event.id}/tickets`)
    assert.equal(res.status, 409)
    assert.equal(res.body.message, 'Ya tenés una inscripción activa a este evento')
  })

  it('5. el user intenta inscribirse a un evento sin cupo → error claro', async () => {
    const full = (await organizer.post('/api/events').send(eventData({ title: 'Copa Relámpago', capacity: 1 }))).body.payload
    assert.equal((await otherUser.post(`/api/events/${full.id}/tickets`)).status, 201)

    const res = await user.post(`/api/events/${full.id}/tickets`)
    assert.equal(res.status, 409)
    assert.equal(res.body.message, 'No quedan cupos disponibles para este evento')
  })

  it('6. el user cancela su ticket → cupo liberado → una nueva inscripción funciona', async () => {
    const [ticket] = (await user.get('/api/tickets/my-tickets')).body.payload.filter((t) => t.event.id === event.id)
    const cancel = await user.patch(`/api/tickets/${ticket.id}/cancel`)
    assert.equal(cancel.status, 200)
    assert.equal(cancel.body.payload.status, 'cancelled')

    assert.equal((await t.api().get(`/api/events/${event.id}`)).body.payload.availableSeats, 2)
    assert.equal((await user.post(`/api/events/${event.id}/tickets`)).status, 201)
  })

  it('7. un organizer intenta modificar un evento ajeno → 403', async () => {
    const res = await otherOrganizer.put(`/api/events/${event.id}`).send({ title: 'Ajeno' })
    assert.equal(res.status, 403)
  })

  it('8. el admin modifica el evento de otro organizador → 200', async () => {
    const res = await admin.put(`/api/events/${event.id}`).send({ location: 'Estadio Obras' })
    assert.equal(res.status, 200)
    assert.equal(res.body.payload.location, 'Estadio Obras')
  })

  it('9. las respuestas de usuario, evento y ticket no contienen password', async () => {
    const responses = await Promise.all([
      t.api().post('/api/sessions/register').send({ first_name: 'N', last_name: 'N', email: 'nuevo@mail.com', password: PASSWORD }),
      user.get('/api/sessions/current'),
      admin.get('/api/users'),
      t.api().get(`/api/events/${event.id}`),
      user.get('/api/tickets/my-tickets'),
      organizer.get(`/api/events/${event.id}/tickets`)
    ])

    for (const res of responses) {
      assert.ok(res.status < 400, `${res.req.path} respondió ${res.status}`)
      noPassword(res.body)
    }
  })

  it('10. GET /api/events?status=published&page=2&limit=5 devuelve la estructura paginada', async () => {
    for (let day = 1; day <= 5; day++) {
      await organizer.post('/api/events').send(eventData({ title: `Fecha ${day}`, date: futureDate(day) }))
    }

    const res = await t.api().get('/api/events?status=published&page=2&limit=5')
    assert.equal(res.status, 200)
    assert.deepEqual(Object.keys(res.body), ['status', 'data', 'page', 'limit', 'total', 'totalPages'])
    assert.equal(res.body.page, 2)
    assert.equal(res.body.limit, 5)
    assert.equal(res.body.total, 7)
    assert.equal(res.body.totalPages, 2)
    assert.equal(res.body.data.length, 2)
  })
})
