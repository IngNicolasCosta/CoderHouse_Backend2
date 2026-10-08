import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startTestServer, eventData } from './helpers.js'

describe('Autorización: 401 sin sesión, 403 sin permisos y flujos permitidos por rol', () => {
  let t, user, otherUser, organizer, otherOrganizer, admin, organizerEvent

  before(async () => {
    t = await startTestServer()
    user = await t.createUser('jugadora')
    otherUser = await t.createUser('jugador')
    organizer = await t.createUser('organizador', 'organizer')
    otherOrganizer = await t.createUser('organizadora', 'organizer')
    admin = await t.createUser('admin', 'admin')
    organizerEvent = (await organizer.post('/api/events').send(eventData())).body.payload
  })
  after(() => t.stop())

  it('responde 401 en las rutas privadas sin sesión', async () => {
    const requests = [
      t.api().get('/api/sessions/current'),
      t.api().post('/api/events').send(eventData()),
      t.api().put(`/api/events/${organizerEvent.id}`).send({ title: 'x' }),
      t.api().get('/api/users'),
      t.api().patch(`/api/users/${user.id}/role`).send({ role: 'admin' }),
      t.api().get('/api/tickets/my-tickets'),
      t.api().post(`/api/events/${organizerEvent.id}/tickets`)
    ]

    for (const res of await Promise.all(requests)) {
      assert.equal(res.status, 401)
      assert.equal(res.body.message, 'No autenticado')
    }
  })

  it('un user no puede crear eventos (403) y un organizer sí (201)', async () => {
    const asUser = await user.post('/api/events').send(eventData())
    const asOrganizer = await organizer.post('/api/events').send(eventData({ title: 'Torneo Clausura' }))

    assert.equal(asUser.status, 403)
    assert.equal(asUser.body.message, 'No tenés permisos para realizar esta acción')
    assert.equal(asOrganizer.status, 201)
    assert.equal(asOrganizer.body.payload.organizer, organizer.id)
  })

  it('un organizer no puede modificar un evento ajeno (403); el dueño y el admin sí (200)', async () => {
    const asOtherOrganizer = await otherOrganizer.put(`/api/events/${organizerEvent.id}`).send({ title: 'Ajeno' })
    const asOwner = await organizer.put(`/api/events/${organizerEvent.id}`).send({ capacity: 12 })
    const asAdmin = await admin.put(`/api/events/${organizerEvent.id}`).send({ location: 'Club GEBA' })

    assert.equal(asOtherOrganizer.status, 403)
    assert.equal(asOtherOrganizer.body.message, 'No tenés permisos para modificar este evento')
    assert.equal(asOwner.status, 200)
    assert.equal(asAdmin.status, 200)
    assert.equal(asAdmin.body.payload.location, 'Club GEBA')
  })

  it('un user no puede cambiar el estado de un evento (403)', async () => {
    const res = await user.patch(`/api/events/${organizerEvent.id}/status`).send({ status: 'cancelled' })
    assert.equal(res.status, 403)
  })

  it('un user no puede cancelar un ticket ajeno (403); el admin sí (200)', async () => {
    const ticket = (await otherUser.post(`/api/events/${organizerEvent.id}/tickets`)).body.payload

    const asUser = await user.patch(`/api/tickets/${ticket.id}/cancel`)
    const asAdmin = await admin.patch(`/api/tickets/${ticket.id}/cancel`)

    assert.equal(asUser.status, 403)
    assert.equal(asUser.body.message, 'No tenés permisos para cancelar esta inscripción')
    assert.equal(asAdmin.status, 200)
    assert.equal(asAdmin.body.payload.status, 'cancelled')
  })

  it('solo el admin ve el listado de usuarios, y sin contraseñas', async () => {
    const asOrganizer = await organizer.get('/api/users')
    const asAdmin = await admin.get('/api/users')

    assert.equal(asOrganizer.status, 403)
    assert.equal(asAdmin.status, 200)
    assert.equal(asAdmin.body.payload.length, 5)
    assert.doesNotMatch(JSON.stringify(asAdmin.body), /password|\$2[aby]\$/)
  })

  it('solo el admin puede cambiar roles, y no el suyo propio', async () => {
    const asOrganizer = await organizer.patch(`/api/users/${user.id}/role`).send({ role: 'admin' })
    const ownRole = await admin.patch(`/api/users/${admin.id}/role`).send({ role: 'user' })
    const promote = await admin.patch(`/api/users/${otherUser.id}/role`).send({ role: 'organizer' })

    assert.equal(asOrganizer.status, 403)
    assert.equal(ownRole.status, 400)
    assert.equal(promote.status, 200)
    assert.equal(promote.body.payload.role, 'organizer')

    // El rol se lee de la base en cada request: la misma sesión ya puede crear eventos
    const create = await otherUser.post('/api/events').send(eventData({ title: 'Torneo nuevo' }))
    assert.equal(create.status, 201)
  })
})
