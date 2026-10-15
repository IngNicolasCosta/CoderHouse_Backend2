import { refId } from './helpers.js'

// Torneo completo. En el detalle, el service le suma availableSeats (cupos disponibles)
export class EventDTO {
  constructor (event) {
    this.id = refId(event)
    this.title = event.title
    this.description = event.description
    this.category = event.category
    this.date = event.date
    this.location = event.location
    this.capacity = event.capacity
    this.price = event.price
    this.status = event.status
    this.organizer = refId(event.organizer)
  }
}

// Datos básicos de un torneo relacionado (populate en mis tickets)
export class EventSummaryDTO {
  constructor (event) {
    this.id = refId(event)
    this.title = event.title
    this.date = event.date
    this.location = event.location
    this.category = event.category
    this.status = event.status
  }
}
