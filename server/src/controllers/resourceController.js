import {
  createResource,
  findResource,
  getHours,
  getRestrictions,
  listResources,
  replaceHours,
  saveRestrictions,
  setResourceActive,
  updateResource,
} from '../models/resourceModel.js'
import { inTransaction } from '../config/db.js'
import { countUpcomingBookings } from '../models/bookingModel.js'
import { getAvailability } from '../services/availabilityService.js'
import { notFound } from '../utils/httpError.js'

const requireResource = async (id) => {
  const resource = await findResource(id)

  if (!resource) {
    throw notFound('Resource not found')
  }

  return resource
}

export async function list(req, res) {
  const { includeInactive, type, minCapacity, search } = req.validated.query
  const canSeeInactive = req.user.role === 'admin' && includeInactive === 'true'

  res.json(
    await listResources({
      includeInactive: canSeeInactive,
      type,
      minCapacity,
      search,
    }),
  )
}

export async function getOne(req, res) {
  res.json(await requireResource(req.params.id))
}

export async function create(req, res) {
  const resource = await inTransaction((db) =>
    createResource(req.validated.body, db),
  )
  res.status(201).json(resource)
}

export async function update(req, res) {
  const resource = await updateResource(req.params.id, req.validated.body)

  if (!resource) {
    throw notFound('Resource not found')
  }

  res.json(resource)
}

export async function changeStatus(req, res) {
  const { isActive } = req.validated.body
  const resource = await setResourceActive(req.params.id, isActive)

  if (!resource) {
    throw notFound('Resource not found')
  }

  const upcomingBookings = isActive
    ? 0
    : await countUpcomingBookings(resource.id)

  res.json({ ...resource, upcomingBookings })
}

export async function availability(req, res) {
  const resource = await requireResource(req.params.id)

  res.json(await getAvailability(resource.id, req.validated.query.date))
}

export async function readHours(req, res) {
  await requireResource(req.params.id)
  res.json(await getHours(req.params.id))
}

export async function saveHours(req, res) {
  await requireResource(req.params.id)
  await replaceHours(req.params.id, req.validated.body.hours)
  res.json(await getHours(req.params.id))
}

export async function readRestrictions(req, res) {
  await requireResource(req.params.id)
  res.json(await getRestrictions(req.params.id))
}

export async function saveRules(req, res) {
  await requireResource(req.params.id)
  res.json(await saveRestrictions(req.params.id, req.validated.body))
}
