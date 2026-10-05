import mongoose from 'mongoose'
import { TicketModel } from '../models/Ticket.js'

class TicketsDao {
  async create (data) {
    const ticket = await TicketModel.create(data)
    return ticket.toObject()
  }

  findById (id) {
    return TicketModel.findById(id).lean()
  }

  findOne (filter) {
    return TicketModel.findOne(filter).lean()
  }

  find (filter, { populate } = {}) {
    const query = TicketModel.find(filter).sort({ createdAt: -1 })
    return (populate ? query.populate(populate) : query).lean()
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

  updateOne (filter, data) {
    return TicketModel.findOneAndUpdate(filter, data, { returnDocument: 'after', runValidators: true }).lean()
  }
}

export const ticketsDao = new TicketsDao()
