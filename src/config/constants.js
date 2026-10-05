export const EVENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
  FINISHED: 'finished'
}

// Ligas del torneo: división (A-E) + rama (femenino / masculino)
export const EVENT_CATEGORIES = ['A', 'B', 'C', 'D', 'E']
  .flatMap((division) => [`${division}-femenino`, `${division}-masculino`])

// Cambios de estado permitidos con PATCH /api/events/:id/status
export const EVENT_STATUS_TRANSITIONS = {
  [EVENT_STATUS.DRAFT]: [EVENT_STATUS.PUBLISHED, EVENT_STATUS.CANCELLED],
  [EVENT_STATUS.PUBLISHED]: [EVENT_STATUS.CANCELLED, EVENT_STATUS.FINISHED],
  [EVENT_STATUS.CANCELLED]: [],
  [EVENT_STATUS.FINISHED]: []
}

// pending: reserva recién creada, mientras se verifica el cupo; confirmed: inscripción confirmada
export const TICKET_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled'
}

// Solo los tickets activos ocupan cupo; los cancelados no se cuentan
export const ACTIVE_TICKET_STATUSES = [TICKET_STATUS.PENDING, TICKET_STATUS.CONFIRMED]

export const EVENT_SORT_FIELDS = ['date', 'price', 'title', 'capacity', 'createdAt']

export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 10,
  maxLimit: 50
}
