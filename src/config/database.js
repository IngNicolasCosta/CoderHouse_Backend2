import mongoose from 'mongoose'
import { config } from './config.js'

export const connectDB = async () => {
  await mongoose.connect(config.mongoUrl)
  console.log('Base de datos conectada')
}

export const disconnectDB = () => mongoose.disconnect()
