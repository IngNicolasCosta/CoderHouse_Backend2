import mongoose from 'mongoose'
import { config } from './config.js'

const SERVER_SELECTION_TIMEOUT_MS = 10000

// Traduce los errores de conexión más comunes a un mensaje que indica qué revisar
const describeConnectionError = (error) => {
  const message = error.message ?? ''

  if (error.name === 'MongoParseError' || /invalid scheme/i.test(message)) {
    return 'MONGO_URL tiene un formato inválido (tiene que empezar con mongodb:// o mongodb+srv://)'
  }
  if (error.code === 8000 || error.code === 18 || /bad auth|authentication failed/i.test(message)) {
    return 'el usuario o la contraseña de MONGO_URL son incorrectos'
  }
  if (/ENOTFOUND|querySrv|EAI_AGAIN/i.test(message)) {
    return 'no se encontró el servidor de MongoDB (revisá el host del cluster en MONGO_URL y tu conexión a internet)'
  }
  if (/ECONNREFUSED/i.test(message)) {
    return 'el servidor de MongoDB rechazó la conexión (si es local, revisá que esté corriendo)'
  }
  if (/ServerSelectionError/.test(error.name)) {
    return `no se pudo llegar a MongoDB en ${SERVER_SELECTION_TIMEOUT_MS / 1000} segundos (en Atlas, revisá que tu IP esté habilitada en Network Access y que el cluster esté activo)`
  }
  return message
}

const onDisconnected = () => console.warn('Se perdió la conexión con MongoDB: Mongoose intentará reconectar')
const onReconnected = () => console.log('Conexión con MongoDB recuperada')

export const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUrl, { serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS })
  } catch (error) {
    throw new Error(`No se pudo conectar a MongoDB: ${describeConnectionError(error)}`, { cause: error })
  }

  // Avisos si la conexión se cae o se recupera con el servidor ya levantado
  mongoose.connection.on('disconnected', onDisconnected)
  mongoose.connection.on('reconnected', onReconnected)

  console.log(`Base de datos conectada (${mongoose.connection.name})`)
}

export const disconnectDB = async () => {
  mongoose.connection.off('disconnected', onDisconnected)
  mongoose.connection.off('reconnected', onReconnected)
  await mongoose.disconnect()
}
