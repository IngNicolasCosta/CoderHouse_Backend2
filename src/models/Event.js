import mongoose from 'mongoose'
import { EVENT_CATEGORIES, EVENT_STATUS } from '../config/constants.js'

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: EVENT_CATEGORIES,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.DRAFT
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
)

export const EventModel = mongoose.model('Event', eventSchema)
