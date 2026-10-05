import { usersDao } from '../dao/users.dao.js'

class UsersRepository {
  constructor (dao) {
    this.dao = dao
  }

  getAll () {
    return this.dao.find()
  }

  getByEmail (email) {
    return this.dao.findOne({ email })
  }

  getById (id) {
    return this.dao.findById(id)
  }

  create (data) {
    return this.dao.create(data)
  }

  updateRole (id, role) {
    return this.dao.updateById(id, { role })
  }
}

export const usersRepository = new UsersRepository(usersDao)
