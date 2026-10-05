import { EventModel } from '../models/Event.js'
import { BaseDAO } from './base.dao.js'

export class EventDAO extends BaseDAO {
  constructor () {
    super(EventModel)
  }
}
