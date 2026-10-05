import { config, validateEnv } from './config/config.js'
import { connectDB } from './config/database.js'

const startServer = async () => {
  try {
    validateEnv()

    // La app se importa después de validar el entorno porque al cargarse
    // registra las estrategias de Passport, que necesitan JWT_SECRET
    const { default: app } = await import('./app.js')
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
