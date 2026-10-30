import { getAvailability } from '../services/availabilityService.js'

export async function show(req, res) {
  res.json(await getAvailability(req.user, req.validated.query))
}
