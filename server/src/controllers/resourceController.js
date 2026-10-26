import { createResource, listResources } from '../models/resourceModel.js'

export async function list(req, res) {
  res.json(await listResources())
}

export async function create(req, res) {
  res.status(201).json(await createResource(req.validated.body))
}
