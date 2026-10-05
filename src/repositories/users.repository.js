import { UserDAO } from '../dao/users.dao.js'

export class UserRepository {
  constructor (dao = new UserDAO()) {
    this.dao = dao
  }

  findAll () {
    return this.dao.find()
  }

  findById (id) {
    return this.dao.findById(id)
  }

  findByEmail (email) {
    return this.dao.findOne({ email })
  }

  createUser (data) {
    return this.dao.create(data)
  }

  updateRole (id, role) {
    return this.dao.update(id, { role })
  }
}

export const userRepository = new UserRepository()
