import mongoose from 'mongoose'
import { config } from './config.js'

export const connectDB = async () => {
  if (!config.mongoUrl) {
    throw new Error('Falta la variable de entorno MONGO_URL')
  }

  await mongoose.connect(config.mongoUrl)
  console.log('Base de datos conectada')
}
