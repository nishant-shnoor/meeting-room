import api, { unwrap } from './api'

const userService = {
  list: (params) => unwrap(api.get('/users', { params })),
  listResetRequests: () => unwrap(api.get('/users/reset-requests')),
  dismissResetRequest: (id) =>
    unwrap(api.delete(`/users/reset-requests/${id}`)),
  create: (values) => unwrap(api.post('/users', values)),
  update: (id, values) => unwrap(api.put(`/users/${id}`, values)),
  setActive: (id, isActive) =>
    unwrap(api.patch(`/users/${id}/status`, { isActive })),
  resetPassword: (id, password) =>
    unwrap(api.put(`/users/${id}/password`, { password })),
}

export default userService
