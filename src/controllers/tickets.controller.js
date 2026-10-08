import { ticketsService } from '../services/tickets.service.js'

export const createTicket = async (req, res) => {
  const ticket = await ticketsService.createTicket(req.params.eid, req.user, req.body)
  res.status(201).json({ status: 'success', payload: ticket })
}

export const getMyTickets = async (req, res) => {
  const tickets = await ticketsService.getMyTickets(req.user.id)
  res.status(200).json({ status: 'success', payload: tickets })
}

export const getEventTickets = async (req, res) => {
  const { tickets, summary } = await ticketsService.getEventTickets(req.event)
  res.status(200).json({ status: 'success', payload: tickets, summary })
}

export const cancelTicket = async (req, res) => {
  const ticket = await ticketsService.cancelTicket(req.ticket, req.user)
  res.status(200).json({ status: 'success', payload: ticket })
}
