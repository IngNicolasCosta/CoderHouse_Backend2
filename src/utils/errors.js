export class AppError extends Error {
  constructor (message, statusCode = 500) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
  }
}

export const ERROR_MESSAGES = {
  missingFields: 'Faltan campos obligatorios',
  invalidEmail: 'El formato del email es inválido',
  emailTaken: 'El email ya está registrado',
  missingCredentials: 'Email y contraseña son obligatorios',
  invalidCredentials: 'Credenciales inválidas',
  unauthenticated: 'No autenticado',
  forbidden: 'No tenés permisos para realizar esta acción',
  eventForbidden: 'No tenés permisos para modificar este evento',
  eventNotFound: 'Evento no encontrado',
  userNotFound: 'Usuario no encontrado',
  invalidRole: 'El rol indicado no es válido',
  ownRoleChange: 'No podés cambiar tu propio rol',
  ticketNotFound: 'Inscripción no encontrada',
  ticketForbidden: 'No tenés permisos para cancelar esta inscripción',
  duplicateTicket: 'Ya tenés una inscripción activa a este evento'
}
