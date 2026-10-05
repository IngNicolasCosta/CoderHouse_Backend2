import mongoose from 'mongoose'
import { TicketModel } from '../models/Ticket.js'
import { BaseDAO } from './base.dao.js'

export class TicketDAO extends BaseDAO {
  constructor () {
    super(TicketModel)
  }

  // Suma la quantity de los tickets de un evento con los estados indicados.
  // Con maxId solo cuenta los tickets creados hasta ese (ids menores o iguales)
  async sumQuantity ({ event, statuses, maxId }) {
    const match = { event: new mongoose.Types.ObjectId(event), status: { $in: statuses } }
    if (maxId) match._id = { $lte: new mongoose.Types.ObjectId(maxId) }

    const [result] = await TicketModel.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ])
    return result?.total ?? 0
  }
}
