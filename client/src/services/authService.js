import api, { unwrap } from './api'

const authService = {
  login: (credentials) => unwrap(api.post('/auth/login', credentials)),
  register: (details) => unwrap(api.post('/auth/register', details)),
  forgotPassword: (email) =>
    unwrap(api.post('/auth/forgot-password', { email })),
  getCurrentUser: () => unwrap(api.get('/auth/me')),
  updateProfile: (values) => unwrap(api.put('/auth/me', values)),
  changePassword: (values) => unwrap(api.put('/auth/me/password', values)),
}

export default authService
