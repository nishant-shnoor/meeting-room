import api, { unwrap } from './api'

const availabilityService = {
  get: ({ resourceId, date, addOnIds = [], ignoreBookingId }) =>
    unwrap(
      api.get('/availability', {
        params: {
          resourceId,
          date,
          addOns: addOnIds.length ? addOnIds.join(',') : undefined,
          ignoreBookingId: ignoreBookingId || undefined,
        },
      }),
    ),
}

export default availabilityService
