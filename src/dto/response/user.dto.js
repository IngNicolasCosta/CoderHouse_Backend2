import { refId } from './helpers.js'

// Ningún DTO de usuario incluye password, ni siquiera hasheada

// Usuario completo para registro y listados de admin
export class UserDTO {
  constructor (user) {
    this.id = refId(user)
    this.first_name = user.first_name
    this.last_name = user.last_name
    this.email = user.email
    this.role = user.role
  }
}

// Usuario autenticado: lo que va en req.user y responde /api/sessions/current
export class CurrentUserDTO {
  constructor (user) {
    this.id = refId(user)
    this.email = user.email
    this.role = user.role
  }
}

// Datos públicos de un usuario relacionado (populate en los tickets de un evento)
export class UserSummaryDTO {
  constructor (user) {
    this.id = refId(user)
    this.first_name = user.first_name
    this.last_name = user.last_name
    this.email = user.email
  }
}
