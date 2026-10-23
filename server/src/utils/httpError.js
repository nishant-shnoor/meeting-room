export class HttpError extends Error {
  constructor(status, message, fields) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

export const notFound = (message) => new HttpError(404, message)
