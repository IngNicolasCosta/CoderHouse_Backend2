import { UserModel } from '../models/User.js'

class UsersDao {
  find (filter = {}) {
    return UserModel.find(filter).lean()
  }

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

  updateById (id, data) {
    return UserModel.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true }).lean()
  }
}

export const usersDao = new UsersDao()
