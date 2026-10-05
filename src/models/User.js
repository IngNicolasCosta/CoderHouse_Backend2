import mongoose from 'mongoose'
import { ROLES } from '../config/permissions.js'

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
      trim: true
    },
    last_name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER
    }
  },
  {
    timestamps: true
  }
)

export const UserModel = mongoose.model('User', userSchema)
