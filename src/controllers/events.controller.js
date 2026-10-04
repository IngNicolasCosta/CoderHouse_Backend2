import { eventsService } from '../services/events.service.js'

export const getEvents = async (req, res) => {
  const events = await eventsService.getEvents()
  res.status(200).json({ status: 'success', payload: events })
}
