import { db } from './mockData'
import { copy, mockError, wait } from './mockApi'
import { normalizeHours, normalizeRestrictions } from '../utils/hours'

const findResource = (id) => {
  const resource = db.resources.find((item) => item.id === id)

  if (!resource) {
    throw mockError('Resource not found')
  }

  return resource
}

const resourceService = {
  list: () => wait(copy(db.resources.filter((item) => item.isActive))),

  get: (id) => wait(copy(findResource(id))),

  getHours: (id) => wait(copy(db.hoursByResource[findResource(id).id])),

  getRestrictions: (id) =>
    wait(copy(db.restrictionsByResource[findResource(id).id])),
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
