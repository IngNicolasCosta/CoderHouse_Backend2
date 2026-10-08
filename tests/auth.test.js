import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startTestServer, PASSWORD } from './helpers.js'

describe('Autenticación: registro, login, current y logout', () => {
  let t

  before(async () => { t = await startTestServer() })
  after(() => t.stop())

  it('registra un usuario sin devolver la contraseña, con el email normalizado y rol user', async () => {
    const res = await t.api().post('/api/sessions/register')
      .send({ first_name: 'Ana', last_name: 'Pérez', email: ' Ana@Mail.com ', password: PASSWORD, role: 'admin' })

    assert.equal(res.status, 201)
    assert.deepEqual(Object.keys(res.body.payload), ['id', 'first_name', 'last_name', 'email', 'role'])
    assert.equal(res.body.payload.email, 'ana@mail.com')
    assert.equal(res.body.payload.role, 'user')
  })

  it('rechaza un email ya registrado (aunque cambien mayúsculas) con 409', async () => {
    const res = await t.api().post('/api/sessions/register')
      .send({ first_name: 'Otra', last_name: 'Ana', email: 'ANA@mail.com', password: PASSWORD })

    assert.equal(res.status, 409)
    assert.equal(res.body.message, 'El email ya está registrado')
  })

  it('valida campos obligatorios, formato de email y largo de contraseña con 400', async () => {
    const register = (body) => t.api().post('/api/sessions/register').send(body)

    assert.equal((await register({ first_name: 'X', email: 'x@mail.com' })).status, 400)
    assert.equal((await register({ first_name: 'X', last_name: 'Y', email: 'mail-invalido', password: PASSWORD })).status, 400)
    assert.equal((await register({ first_name: 'X', last_name: 'Y', email: 'x@mail.com', password: '123' })).status, 400)
  })

  it('el login setea la cookie currentUser HttpOnly y /current devuelve solo { id, email, role }', async () => {
    const session = t.agent()
    const login = await session.post('/api/sessions/login').send({ email: 'ana@mail.com', password: PASSWORD })

    assert.equal(login.status, 200)
    const cookie = login.headers['set-cookie'][0]
    assert.match(cookie, /^currentUser=/)
    assert.match(cookie, /HttpOnly/)
    assert.match(cookie, /SameSite=Lax/)

    const current = await session.get('/api/sessions/current')
    assert.equal(current.status, 200)
    assert.deepEqual(Object.keys(current.body.payload), ['id', 'email', 'role'])
    assert.equal(current.body.payload.email, 'ana@mail.com')
  })

  it('responde el mismo 401 genérico para email inexistente y contraseña incorrecta', async () => {
    const login = (email, password) => t.api().post('/api/sessions/login').send({ email, password })
    const unknownEmail = await login('nadie@mail.com', PASSWORD)
    const wrongPassword = await login('ana@mail.com', 'Incorrecta1')

    assert.equal(unknownEmail.status, 401)
    assert.equal(wrongPassword.status, 401)
    assert.equal(unknownEmail.body.message, 'Credenciales inválidas')
    assert.equal(wrongPassword.body.message, 'Credenciales inválidas')
  })

  it('después del logout, /current responde 401', async () => {
    const session = await t.login('ana@mail.com')

    assert.equal((await session.post('/api/sessions/logout')).status, 200)
    const current = await session.get('/api/sessions/current')
    assert.equal(current.status, 401)
    assert.equal(current.body.message, 'No autenticado')
  })

  it('rechaza un token manipulado o inválido con 401', async () => {
    const login = await t.api().post('/api/sessions/login').send({ email: 'ana@mail.com', password: PASSWORD })
    const token = login.headers['set-cookie'][0].split(';')[0].split('=')[1]
    const [header, payload, signature] = token.split('.')
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url')), role: 'admin' })).toString('base64url')

    const tampered = await t.api().get('/api/sessions/current').set('Cookie', `currentUser=${header}.${forged}.${signature}`)
    const garbage = await t.api().get('/api/sessions/current').set('Cookie', 'currentUser=abc')

    assert.equal(tampered.status, 401)
    assert.equal(garbage.status, 401)
  })
})
