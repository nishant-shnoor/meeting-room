import api, { unwrap } from './api'

const authService = {
  login: (credentials) => unwrap(api.post('/auth/login', credentials)),
  register: (details) => unwrap(api.post('/auth/register', details)),
  getCurrentUser: () => unwrap(api.get('/auth/me')),
}

export default authService
