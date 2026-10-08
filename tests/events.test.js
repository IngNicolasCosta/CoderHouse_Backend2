import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startTestServer, eventData, futureDate } from './helpers.js'

describe('Eventos: reglas de negocio, estados, listado y DTO', () => {
  let t, organizer

  before(async () => {
    t = await startTestServer()
    organizer = await t.createUser('organizador', 'organizer')
  })
  after(() => t.stop())

  it('rechaza fecha pasada, capacity no positiva y price negativo con 400', async () => {
    const create = (overrides) => organizer.post('/api/events').send(eventData(overrides))

    const pastDate = await create({ date: '2020-01-01T10:00:00Z' })
    assert.equal(pastDate.status, 400)
    assert.equal(pastDate.body.message, 'La fecha del evento debe ser futura')
    assert.equal((await create({ capacity: 0 })).status, 400)
    assert.equal((await create({ price: -1 })).status, 400)
    assert.equal((await create({ title: undefined, category: undefined })).status, 400)
  })

  it('ignora el organizer del body y responde con el formato del DTO', async () => {
    const res = await organizer.post('/api/events').send(eventData({ organizer: '000000000000000000000000' }))

    assert.equal(res.status, 201)
    assert.equal(res.body.payload.organizer, organizer.id)
    assert.deepEqual(Object.keys(res.body.payload),
      ['id', 'title', 'description', 'category', 'date', 'location', 'capacity', 'price', 'status', 'organizer'])
  })

  it('no permite cambiar el estado ni modificar un evento cancelado (409)', async () => {
    const event = (await organizer.post('/api/events').send(eventData())).body.payload

    assert.equal((await organizer.patch(`/api/events/${event.id}/status`).send({ status: 'cancelled' })).status, 200)
    const republish = await organizer.patch(`/api/events/${event.id}/status`).send({ status: 'published' })
    const update = await organizer.put(`/api/events/${event.id}`).send({ title: 'Otro' })

    assert.equal(republish.status, 409)
    assert.equal(republish.body.message, 'No se puede cambiar el estado de un evento cancelado')
    assert.equal(update.status, 409)
  })

  it('valida las transiciones de estado (published → draft no está permitido)', async () => {
    const event = (await organizer.post('/api/events').send(eventData())).body.payload
    const res = await organizer.patch(`/api/events/${event.id}/status`).send({ status: 'draft' })

    assert.equal(res.status, 409)
  })

  it('los borradores no son públicos: 404 para anónimos y 200 para su dueño', async () => {
    const draft = (await organizer.post('/api/events').send(eventData({ status: 'draft' }))).body.payload

    assert.equal((await t.api().get(`/api/events/${draft.id}`)).status, 404)
    assert.equal((await organizer.get(`/api/events/${draft.id}`)).status, 200)
  })

  it('lista con filtros, paginación y ordenamiento', async () => {
    for (let day = 1; day <= 6; day++) {
      await organizer.post('/api/events')
        .send(eventData({ title: `Fecha ${day}`, category: 'C-masculino', date: futureDate(day), price: day * 100 }))
    }

    const page2 = await t.api().get('/api/events?status=published&category=C-masculino&page=2&limit=4')
    assert.equal(page2.status, 200)
    assert.equal(page2.body.total, 6)
    assert.equal(page2.body.totalPages, 2)
    assert.equal(page2.body.page, 2)
    assert.deepEqual(page2.body.data.map((event) => event.title), ['Fecha 5', 'Fecha 6'])

    const byPrice = await t.api().get('/api/events?category=C-masculino&sort=-price&limit=1')
    assert.equal(byPrice.body.data[0].title, 'Fecha 6')
  })

  it('valida los parámetros del listado con 400', async () => {
    assert.equal((await t.api().get('/api/events?status=draft')).status, 400)
    assert.equal((await t.api().get('/api/events?category=workshop')).status, 400)
    assert.equal((await t.api().get('/api/events?page=0')).status, 400)
    assert.equal((await t.api().get('/api/events?sort=organizer')).status, 400)
  })

  it('responde 404 para eventos inexistentes o con id inválido (no 500)', async () => {
    assert.equal((await t.api().get('/api/events/000000000000000000000000')).status, 404)
    assert.equal((await t.api().get('/api/events/id-invalido')).status, 404)
  })
})
