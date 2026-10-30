import {
  createResource,
  findResource,
  findResourcesByIds,
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
import { getResourceAvailability } from '../services/availabilityService.js'
import { conflict, invalid, notFound } from '../utils/httpError.js'

const requireResource = async (id) => {
  const resource = await findResource(id)

  if (!resource) {
    throw notFound('Resource not found')
  }

  return resource
}

const assertBuiltInValid = async (roomId, ids, db) => {
  if (!ids.length) {
    return
  }

  const found = await findResourcesByIds(ids, db)

  if (found.length !== ids.length) {
    throw invalid('One of the built-in resources no longer exists', {
      builtInResourceIds: 'Choose valid resources',
    })
  }

  const wrongType = found.find((item) => item.type !== 'equipment')

  if (wrongType) {
    throw invalid(
      `${wrongType.name} is a room and cannot be built into another room`,
      { builtInResourceIds: 'Only resources can be built into a room' },
    )
  }

  const taken = found.find(
    (item) => item.builtInRoom && item.builtInRoom.id !== roomId,
  )

  if (taken) {
    const message = `${taken.name} is already built into ${taken.builtInRoom.name}`
    throw conflict(message)
  }
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
  const resource = await inTransaction(async (db) => {
    await assertBuiltInValid(null, req.validated.body.builtInResourceIds, db)
    return createResource(req.validated.body, db)
  })
  res.status(201).json(resource)
}

export async function update(req, res) {
  const existing = await requireResource(req.params.id)
  const values = req.validated.body

  if (values.type !== existing.type) {
    throw invalid(
      'A room cannot be turned into a resource or the other way round',
      { type: 'Type cannot be changed' },
    )
  }

  if (values.builtInResourceIds.includes(existing.id)) {
    throw invalid('A room cannot be built into itself', {
      builtInResourceIds: 'Invalid selection',
    })
  }

  const resource = await inTransaction(async (db) => {
    await assertBuiltInValid(existing.id, values.builtInResourceIds, db)
    return updateResource(existing.id, values, db)
  })
  res.json(resource)
}

export async function changeStatus(req, res) {
  const resource = await setResourceActive(
    req.params.id,
    req.validated.body.isActive,
  )

  if (!resource) {
    throw notFound('Resource not found')
  }

  const { isActive } = req.validated.body
  const upcomingBookings = isActive
    ? 0
    : await countUpcomingBookings(resource.id)

  res.json({ ...resource, upcomingBookings })
}

export async function availability(req, res) {
  const resource = await requireResource(req.params.id)
  res.json(await getResourceAvailability(resource.id, req.validated.query.date))
}

const hoursOwnerId = (resource) => resource.builtInRoom?.id ?? resource.id

const rejectBuiltIn = (resource, what) => {
  if (resource.builtInRoom) {
    throw conflict(
      `${resource.name} is built into ${resource.builtInRoom.name} and follows that room's ${what}. Remove it from the room to set its own.`,
    )
  }
}

export async function readHours(req, res) {
  const resource = await requireResource(req.params.id)
  res.json(await getHours(hoursOwnerId(resource)))
}

export async function saveHours(req, res) {
  const resource = await requireResource(req.params.id)
  rejectBuiltIn(resource, 'operating hours')
  await replaceHours(req.params.id, req.validated.body.hours)
  res.json(await getHours(req.params.id))
}

export async function readRestrictions(req, res) {
  const resource = await requireResource(req.params.id)
  res.json(await getRestrictions(hoursOwnerId(resource)))
}

export async function saveRules(req, res) {
  const resource = await requireResource(req.params.id)
  rejectBuiltIn(resource, 'booking restrictions')
  res.json(await saveRestrictions(req.params.id, req.validated.body))
}
