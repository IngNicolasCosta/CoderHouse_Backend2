import { usersDao } from '../dao/users.dao.js'

class UsersRepository {
  constructor (dao) {
    this.dao = dao
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
}

export const usersRepository = new UsersRepository(usersDao)
