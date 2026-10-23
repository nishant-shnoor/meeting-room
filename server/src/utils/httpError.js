export class HttpError extends Error {
  constructor(status, message, fields) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

export const unauthorized = (message) => new HttpError(401, message)
export const forbidden = (message) => new HttpError(403, message)
export const notFound = (message) => new HttpError(404, message)
export const conflict = (message) => new HttpError(409, message)
export const invalid = (message, fields) => new HttpError(422, message, fields)
