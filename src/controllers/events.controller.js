import { eventsService } from '../services/events.service.js'

export const getEvents = async (req, res) => {
  const result = await eventsService.listEvents(req.query)
  res.status(200).json({ status: 'success', ...result })
}

export const getEventById = async (req, res) => {
  const event = await eventsService.getVisibleEvent(req.params.id, req.user)
  res.status(200).json({ status: 'success', payload: event })
}

export const createEvent = async (req, res) => {
  const event = await eventsService.createEvent(req.body, req.user.id)
  res.status(201).json({ status: 'success', payload: event })
}

export const updateEvent = async (req, res) => {
  const event = await eventsService.updateEvent(req.event, req.body)
  res.status(200).json({ status: 'success', payload: event })
}

export const changeEventStatus = async (req, res) => {
  const event = await eventsService.changeStatus(req.event, req.body?.status)
  res.status(200).json({ status: 'success', payload: event })
}
