import api, { unwrap } from './api'
import { normalizeHours, normalizeRestrictions } from '../utils/hours'

const resourceService = {
  list: (type) => unwrap(api.get('/resources', { params: { type } })),
  listAll: (type) =>
    unwrap(api.get('/resources', { params: { includeInactive: true, type } })),
  listRooms: () => resourceService.list('room'),
  listEquipment: () => resourceService.list('equipment'),
  listAllRooms: () => resourceService.listAll('room'),
  listAllEquipment: () => resourceService.listAll('equipment'),
  get: (id) => unwrap(api.get(`/resources/${id}`)),
  create: (values) => unwrap(api.post('/resources', values)),
  update: (id, values) => unwrap(api.put(`/resources/${id}`, values)),
  setActive: (id, isActive) =>
    unwrap(api.patch(`/resources/${id}/status`, { isActive })),
  getHours: (id) => unwrap(api.get(`/resources/${id}/hours`)),
  saveHours: (id, hours) =>
    unwrap(api.put(`/resources/${id}/hours`, { hours })),
  getRestrictions: (id) => unwrap(api.get(`/resources/${id}/restrictions`)),
  saveRestrictions: (id, values) =>
    unwrap(api.put(`/resources/${id}/restrictions`, values)),
}

resourceService.getBookingSetup = async (id) => {
  const [resource, hours, restrictions] = await Promise.all([
    resourceService.get(id),
    resourceService.getHours(id),
    resourceService.getRestrictions(id),
  ])
  return {
    resource,
    hours: normalizeHours(hours),
    restrictions: normalizeRestrictions(restrictions),
  }
}

export default resourceService
