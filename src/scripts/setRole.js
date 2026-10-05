import mongoose from 'mongoose'
import { validateEnv } from '../config/config.js'
import { connectDB } from '../config/database.js'
import { ROLES } from '../config/permissions.js'
import { usersRepository } from '../repositories/users.repository.js'
import { normalizeEmail } from '../utils/validators.js'

// Uso: npm run set-role -- <email> <rol>
// Permite crear el primer admin, ya que el registro público siempre crea usuarios con rol user
const [email, role] = process.argv.slice(2)

const setRole = async () => {
  if (!email || !Object.values(ROLES).includes(role)) {
    throw new Error(`Uso: npm run set-role -- <email> <${Object.values(ROLES).join('|')}>`)
  }

  validateEnv()
  await connectDB()

  const user = await usersRepository.getByEmail(normalizeEmail(email))
  if (!user) {
    throw new Error(`No existe un usuario con el email ${email}`)
  }

  await usersRepository.updateRole(user._id, role)
  console.log(`Rol de ${user.email} actualizado a ${role}`)
}

setRole()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
