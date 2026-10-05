export const ROLES = {
  USER: 'user',
  ORGANIZER: 'organizer',
  ADMIN: 'admin'
}

// Matriz de permisos: qué roles pueden realizar cada acción.
// Las rutas usan estas listas con authorizeRoles en lugar de escribir roles a mano.
export const PERMISSIONS = {
  readPublishedEvents: [ROLES.USER, ROLES.ORGANIZER, ROLES.ADMIN],
  createEvent: [ROLES.ORGANIZER, ROLES.ADMIN],
  manageOwnEvent: [ROLES.ORGANIZER, ROLES.ADMIN],
  manageAnyEvent: [ROLES.ADMIN],
  readUsers: [ROLES.ADMIN],
  changeUserRole: [ROLES.ADMIN]
}
