import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startTestServer, eventData, waitForCalls } from './helpers.js'

describe('Tickets: inscripciones, cupos, cancelaciones y emails', () => {
  let t, organizer, otherOrganizer, ana, beto

  before(async () => {
    t = await startTestServer()
    organizer = await t.createUser('organizador', 'organizer')
    otherOrganizer = await t.createUser('organizadora', 'organizer')
    ana = await t.createUser('ana')
    beto = await t.createUser('beto')
  })
  after(() => t.stop())

  const createEvent = async (overrides) => (await organizer.post('/api/events').send(eventData(overrides))).body.payload

  it('inscribe con 201, ticket confirmado y email de confirmación', async () => {
    const event = await createEvent()
    const res = await ana.post(`/api/events/${event.id}/tickets`)

    assert.equal(res.status, 201)
    assert.equal(res.body.payload.status, 'confirmed')
    assert.match(res.body.payload.reservationCode, /^VOL-[A-Z0-9]{6}$/)
    assert.equal(await waitForCalls(t.mails.confirmation, 1), 1)
    assert.equal(t.mails.confirmation.mock.calls[0].arguments[0].to, 'ana@mail.com')
  })

  it('rechaza una inscripción duplicada activa con 409', async () => {
    const event = await createEvent()
    await ana.post(`/api/events/${event.id}/tickets`)
    const duplicate = await ana.post(`/api/events/${event.id}/tickets`)

    assert.equal(duplicate.status, 409)
    assert.equal(duplicate.body.message, 'Ya tenés una inscripción activa a este evento')
  })

  it('rechaza la inscripción si no alcanza el cupo, con un mensaje claro', async () => {
    const event = await createEvent({ capacity: 1 })
    const res = await ana.post(`/api/events/${event.id}/tickets`).send({ quantity: 2 })

    assert.equal(res.status, 409)
    assert.equal(res.body.message, 'No hay cupos suficientes: quedan 1 y pediste 2')
  })

  it('no permite inscribirse a un evento cancelado (409) ni a uno inexistente (404)', async () => {
    const event = await createEvent()
    await organizer.patch(`/api/events/${event.id}/status`).send({ status: 'cancelled' })

    assert.equal((await ana.post(`/api/events/${event.id}/tickets`)).status, 409)
    assert.equal((await ana.post('/api/events/000000000000000000000000/tickets')).status, 404)
  })

  it('cancelar cambia el estado, guarda cancelledAt, avisa por email y libera el cupo', async () => {
    const event = await createEvent({ capacity: 1 })
    const ticket = (await ana.post(`/api/events/${event.id}/tickets`)).body.payload
    assert.equal((await beto.post(`/api/events/${event.id}/tickets`)).status, 409)

    const cancellationsBefore = t.mails.cancellation.mock.callCount()
    const cancel = await ana.patch(`/api/tickets/${ticket.id}/cancel`)

    assert.equal(cancel.status, 200)
    assert.equal(cancel.body.payload.status, 'cancelled')
    assert.ok(cancel.body.payload.cancelledAt)
    assert.equal(await waitForCalls(t.mails.cancellation, cancellationsBefore + 1), cancellationsBefore + 1)
    assert.equal(t.mails.cancellation.mock.calls.at(-1).arguments[0].cancelledByAdmin, false)

    // El ticket cancelado no ocupa cupo: otra persona puede inscribirse
    assert.equal((await beto.post(`/api/events/${event.id}/tickets`)).status, 201)

    const again = await ana.patch(`/api/tickets/${ticket.id}/cancel`)
    assert.equal(again.status, 409)
    assert.equal(again.body.message, 'La inscripción ya está cancelada')
  })

  it('solo el organizer dueño o un admin ven los inscriptos, sin contraseñas', async () => {
    const event = await createEvent()
    await ana.post(`/api/events/${event.id}/tickets`)

    assert.equal((await ana.get(`/api/events/${event.id}/tickets`)).status, 403)
    assert.equal((await otherOrganizer.get(`/api/events/${event.id}/tickets`)).status, 403)

    const asOwner = await organizer.get(`/api/events/${event.id}/tickets`)
    assert.equal(asOwner.status, 200)
    assert.deepEqual(Object.keys(asOwner.body.payload[0].user), ['id', 'first_name', 'last_name', 'email'])
    assert.deepEqual(asOwner.body.summary, { capacity: 10, occupied: 1, available: 9 })
    assert.doesNotMatch(JSON.stringify(asOwner.body), /password|\$2[aby]\$/)
  })

  it('my-tickets devuelve solo los tickets propios, con los datos básicos del evento', async () => {
    const res = await beto.get('/api/tickets/my-tickets')

    assert.equal(res.status, 200)
    assert.ok(res.body.payload.length > 0)
    for (const ticket of res.body.payload) {
      assert.equal(ticket.user, beto.id)
      assert.deepEqual(Object.keys(ticket.event), ['id', 'title', 'date', 'location', 'category', 'status'])
    }
  })

  it('con inscripciones simultáneas nunca se supera el cupo', async () => {
    const event = await createEvent({ capacity: 3 })
    const crowd = await Promise.all(Array.from({ length: 8 }, (_, i) => t.createUser(`fan${i}`)))

    const results = await Promise.all(crowd.map((session) => session.post(`/api/events/${event.id}/tickets`)))
    const statuses = results.map((res) => res.status)

    assert.equal(statuses.filter((status) => status === 201).length, 3)
    assert.equal(statuses.filter((status) => status === 409).length, 5)
  })
})
