import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

// Verifica las reglas de la arquitectura en capas leyendo los imports de cada archivo de src/

const SRC = join(import.meta.dirname, '..', 'src')

const listFiles = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? listFiles(join(dir, entry.name)) : entry.name.endsWith('.js') ? [join(dir, entry.name)] : [])

const files = listFiles(SRC).map((path) => {
  const source = readFileSync(path, 'utf8')
  const imports = [...source.matchAll(/^\s*import\s[^'"]*['"]([^'"]+)['"]/gm)].map((match) => match[1])
  return { path: relative(SRC, path).split(sep).join('/'), imports }
})

const inLayer = (layer) => files.filter((file) => file.path.startsWith(`${layer}/`))
const importsMongoose = (file) => file.imports.includes('mongoose')
const importsLayer = (file, layer) => file.imports.some((path) => path.includes(`/${layer}/`))

const offenders = (list, predicate) => list.filter(predicate).map((file) => file.path)

describe('Arquitectura en capas', () => {
  it('cada entidad principal tiene su DAO, su Repository y sus DTOs', () => {
    const paths = files.map((file) => file.path)
    for (const entity of ['users', 'events', 'tickets']) {
      assert.ok(paths.includes(`dao/${entity}.dao.js`), `falta dao/${entity}.dao.js`)
      assert.ok(paths.includes(`repositories/${entity}.repository.js`), `falta repositories/${entity}.repository.js`)
    }
    for (const dto of ['user', 'event', 'ticket']) {
      assert.ok(paths.includes(`dto/response/${dto}.dto.js`), `falta dto/response/${dto}.dto.js`)
    }
  })

  it('solo los DAO importan los modelos de Mongoose', () => {
    assert.deepEqual(offenders(files, (file) => importsLayer(file, 'models') && !file.path.startsWith('dao/')), [])
  })

  it('mongoose solo se usa en DAO, modelos y la conexión a la base', () => {
    const allowed = (file) => file.path.startsWith('dao/') || file.path.startsWith('models/') || file.path === 'config/database.js'
    assert.deepEqual(offenders(files, (file) => importsMongoose(file) && !allowed(file)), [])
  })

  it('los repositories usan su DAO y no importan modelos ni mongoose', () => {
    for (const file of inLayer('repositories')) {
      assert.ok(importsLayer(file, 'dao'), `${file.path} no usa un DAO`)
    }
    assert.deepEqual(offenders(inLayer('repositories'), (file) => importsLayer(file, 'models') || importsMongoose(file)), [])
  })

  it('los services consumen repositories, nunca DAO ni modelos', () => {
    assert.deepEqual(offenders(inLayer('services'),
      (file) => importsLayer(file, 'dao') || importsLayer(file, 'models') || importsMongoose(file)), [])
  })

  it('los controllers solo coordinan: no importan modelos, DAO ni repositories', () => {
    assert.deepEqual(offenders(inLayer('controllers'),
      (file) => importsLayer(file, 'models') || importsLayer(file, 'dao') || importsLayer(file, 'repositories') || importsMongoose(file)), [])
  })

  it('las rutas solo conectan URLs con middlewares y controllers', () => {
    assert.deepEqual(offenders(inLayer('routes'),
      (file) => ['models', 'dao', 'repositories', 'services'].some((layer) => importsLayer(file, layer))), [])
  })
})
