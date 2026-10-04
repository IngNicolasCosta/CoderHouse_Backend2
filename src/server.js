import app from './app.js'
import { config } from './config/config.js'
import { connectDB } from './config/database.js'

const startServer = async () => {
  try {
    await connectDB()

    app.listen(config.port, () => {
      console.log(`Servidor escuchando en el puerto ${config.port} (${config.nodeEnv})`)
    })
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message)
    process.exit(1)
  }
}

startServer()
