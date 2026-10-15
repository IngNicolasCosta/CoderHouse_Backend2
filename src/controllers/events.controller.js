import { eventsService } from '../services/events.service.js'
import { EventQueryDTO } from '../dto/request/event-query.dto.js'
import { CreateEventDTO } from '../dto/request/create-event.dto.js'
import { UpdateEventDTO } from '../dto/request/update-event.dto.js'
import { ChangeEventStatusDTO } from '../dto/request/change-event-status.dto.js'

// Los controllers solo manejan HTTP: arman el DTO de entrada con el request,
// llaman al service y devuelven su respuesta (que ya es un DTO de salida)

export const getEvents = async (req, res) => {
  const result = await eventsService.listEvents(new EventQueryDTO(req.query))
  res.status(200).json({ status: 'success', ...result })
}

export const getEventById = async (req, res) => {
  const event = await eventsService.getVisibleEvent(req.params.id, req.user)
  res.status(200).json({ status: 'success', payload: event })
}

export const createEvent = async (req, res) => {
  const event = await eventsService.createEvent(new CreateEventDTO(req.body), req.user.id)
  res.status(201).json({ status: 'success', payload: event })
}

export const updateEvent = async (req, res) => {
  const event = await eventsService.updateEvent(req.event, new UpdateEventDTO(req.body))
  res.status(200).json({ status: 'success', payload: event })
}

export const changeEventStatus = async (req, res) => {
  const { status } = new ChangeEventStatusDTO(req.body)
  const event = await eventsService.changeStatus(req.event, status)
  res.status(200).json({ status: 'success', payload: event })
}
