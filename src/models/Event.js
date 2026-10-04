import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    division: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'E'],
      required: true
    },
    gender: {
      type: String,
      enum: ['femenino', 'masculino'],
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
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'finished'],
      default: 'draft'
    }
  },
  {
    timestamps: true
  }
)

export const EventModel = mongoose.model('Event', eventSchema)
