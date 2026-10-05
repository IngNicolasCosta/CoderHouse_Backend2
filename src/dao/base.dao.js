import mongoose from 'mongoose'

// Operaciones comunes de acceso a datos con Mongoose. Cada DAO de entidad la extiende
// con su modelo; ninguna otra capa del proyecto usa los modelos directamente
export class BaseDAO {
  constructor (model) {
    this.model = model
  }

  // Un id con formato inválido no puede existir en la base: se trata como "no encontrado"
  async findById (id) {
    return mongoose.isValidObjectId(id) ? this.model.findById(id).lean() : null
  }

  findOne (filter) {
    return this.model.findOne(filter).lean()
  }

  find (filter = {}, { sort, skip, limit, populate } = {}) {
    const query = this.model.find(filter)
    if (sort) query.sort(sort)
    if (skip) query.skip(skip)
    if (limit) query.limit(limit)
    if (populate) query.populate(populate)
    return query.lean()
  }

  count (filter = {}) {
    return this.model.countDocuments(filter)
  }

  async create (data) {
    const document = await this.model.create(data)
    return document.toObject()
  }

  async update (id, data) {
    return mongoose.isValidObjectId(id)
      ? this.model.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true }).lean()
      : null
  }

  updateOne (filter, data) {
    return this.model.findOneAndUpdate(filter, data, { returnDocument: 'after', runValidators: true }).lean()
  }
}
