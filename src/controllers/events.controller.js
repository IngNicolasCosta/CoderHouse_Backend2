import { eventsService } from '../services/events.service.js'

export const getEvents = async (req, res) => {
  const events = await eventsService.getPublishedEvents()
  res.status(200).json({ status: 'success', payload: events })
}

export const createEvent = async (req, res) => {
  const event = await eventsService.createEvent(req.body, req.user.id)
  res.status(201).json({ status: 'success', payload: event })
}

export const updateEvent = async (req, res) => {
  const event = await eventsService.updateEvent(req.event.id, req.body)
  res.status(200).json({ status: 'success', payload: event })
}

export const cancelEvent = async (req, res) => {
  const event = await eventsService.cancelEvent(req.event.id)
  res.status(200).json({ status: 'success', payload: event })
}
