import { UserModel } from '../models/User.js'
import { BaseDAO } from './base.dao.js'

export class UserDAO extends BaseDAO {
  constructor () {
    super(UserModel)
  }
}
