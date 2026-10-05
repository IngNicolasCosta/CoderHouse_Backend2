import { UserModel } from '../models/User.js'

class UsersDao {
  findOne (filter) {
    return UserModel.findOne(filter).lean()
  }

  findById (id) {
    return UserModel.findById(id).lean()
  }

  async create (data) {
    const user = await UserModel.create(data)
    return user.toObject()
  }
}

export const usersDao = new UsersDao()
