import api, { unwrap } from './api'

const bookingService = {
  listMine: () => unwrap(api.get('/bookings/mine')),
  listAll: (filters) => unwrap(api.get('/bookings', { params: filters })),
  listInRange: (params) => unwrap(api.get('/bookings/calendar', { params })),
  get: (id) => unwrap(api.get(`/bookings/${id}`)),
  create: (values) => unwrap(api.post('/bookings', values)),
  update: (id, values) => unwrap(api.put(`/bookings/${id}`, values)),
  cancel: (id) => unwrap(api.patch(`/bookings/${id}/cancel`)),
}

export default bookingService
