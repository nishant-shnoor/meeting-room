const DELAY_MS = 200

export const wait = (value) =>
  new Promise((resolve) => setTimeout(() => resolve(value), DELAY_MS))

export const copy = (value) => JSON.parse(JSON.stringify(value))

export const mockError = (message) => ({
  response: { status: 409, data: { message } },
})
