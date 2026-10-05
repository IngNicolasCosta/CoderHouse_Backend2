import mongoose from 'mongoose'
import { ACTIVE_TICKET_STATUSES, TICKET_STATUS } from '../config/constants.js'

const ticketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    status: {
      type: String,
      enum: Object.values(TICKET_STATUS),
      default: TICKET_STATUS.PENDING
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    reservationCode: {
      type: String,
      required: true,
      unique: true
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
)

// Un usuario solo puede tener un ticket activo por evento (la base lo garantiza
// aunque lleguen dos inscripciones al mismo tiempo)
ticketSchema.index(
  { user: 1, event: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ACTIVE_TICKET_STATUSES } } }
)
ticketSchema.index({ event: 1, status: 1 })

export const TicketModel = mongoose.model('Ticket', ticketSchema)
