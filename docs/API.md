# API documentation

Base URL (local): `http://localhost:5000/api`

All endpoints except register, login and health need the header `Authorization: Bearer <token>`.
All request and response bodies are JSON. Times are ISO 8601 strings in UTC.

## Errors

Every error has the same shape:

```json
{ "message": "Closes at 18:00", "errors": { "endTime": "Closes at 18:00" } }
```

`errors` is only present for validation failures (422).

| Status | Meaning |
| --- | --- |
| 400 | Request body is not valid JSON |
| 401 | Missing, invalid or expired token, or wrong login |
| 403 | Logged in but not allowed (for example an employee calling an admin endpoint) |
| 404 | Record or route not found |
| 409 | Conflict: overlapping booking, duplicate email or resource name, booking cannot be changed any more |
| 422 | Validation failed or a booking rule was broken |
| 429 | Too many requests |
| 500 | Unexpected server error |

## Auth

### POST /auth/register
Creates an employee account and signs the user in.

Body: `name` (2-100 chars), `email`, `password` (8-72 chars)

Response 201: `{ "token": "...", "user": { "id", "name", "email", "role" } }`

### POST /auth/login
Body: `email`, `password`

Response 200: same as register. 401 for wrong credentials, 403 for a deactivated account.

### GET /auth/me
Returns the signed in user: `{ "id", "name", "email", "role" }`

## Resources

A resource looks like this:

```json
{
  "id": "uuid",
  "name": "Boardroom",
  "type": "room",
  "capacity": 12,
  "facilities": "Projector, Whiteboard",
  "description": "Large room on the 3rd floor",
  "isActive": true
}
```

### GET /resources
Active resources, sorted by name. Optional query: `type` (`room` or `equipment`), `minCapacity` (whole number), `search` (matches name or facilities). Admins can pass `?includeInactive=true` to include disabled ones.

### GET /resources/:id
One resource.

### POST /resources (admin)
Body: `name` (max 100, unique ignoring case), `type` (`room` or `equipment`), `capacity` (whole number above 0, required for rooms, ignored for equipment), `facilities` (max 500), `description` (max 1000).

Creates the resource together with default operating hours (Monday to Saturday, 09:00 to 18:00, Sunday closed) and default restrictions. Response 201.

### PUT /resources/:id (admin)
Same body as create. Returns the updated resource.

### PATCH /resources/:id/status (admin)
Body: `{ "isActive": false }`. Disabled resources cannot be booked. The response is the resource plus `upcomingBookings`, the number of confirmed future bookings that still exist on it, so the admin can handle them. Those bookings can be listed with `GET /bookings?needsAttention=true`.

### GET /resources/:id/availability
Query: `date` (YYYY-MM-DD, business time zone). Returns whether the resource is open that day, its opening hours, the busy periods and the free slots (one per slot step, future only):

```json
{
  "date": "2026-10-30",
  "isOpen": true,
  "openTime": "09:00",
  "closeTime": "18:00",
  "slotStepMinutes": 30,
  "busy": [{ "bookingId": "uuid", "startTime": "...", "endTime": "..." }],
  "freeSlots": [{ "startTime": "...", "endTime": "..." }]
}
```

### GET /resources/:id/hours
Always 7 rows:

```json
[{ "dayOfWeek": 1, "isOpen": true, "openTime": "09:00", "closeTime": "18:00" }]
```

`dayOfWeek` is 0 for Sunday up to 6 for Saturday.

### PUT /resources/:id/hours (admin)
Body: `{ "hours": [ ...7 rows as above ] }`. Each day must appear once. For open days `closeTime` must be after `openTime`.

### GET /resources/:id/restrictions
```json
{ "minDurationMinutes": 30, "maxDurationMinutes": 240, "maxAdvanceDays": 30, "slotStepMinutes": 30 }
```

### PUT /resources/:id/restrictions (admin)
Same body. Maximum cannot be less than minimum, and the minimum must be a multiple of the slot step.

## Bookings

A booking looks like this:

```json
{
  "id": "uuid",
  "resourceId": "uuid",
  "resourceName": "Boardroom",
  "userId": "uuid",
  "userName": "Demo Employee",
  "userEmail": "employee@roombook.com",
  "startTime": "2026-10-26T04:30:00.000Z",
  "endTime": "2026-10-26T05:30:00.000Z",
  "purpose": "Weekly sync",
  "status": "confirmed",
  "resourceActive": true,
  "createdAt": "2026-10-23T05:00:00.000Z"
}
```

`status` is `confirmed`, `cancelled` or `completed`. Completed is worked out from the end time of a confirmed booking.

`userEmail` and `purpose` are only returned to the booking owner and admins. Other users get `null`.

### Booking rules

These are checked on the server for create and edit:

- start is in the future and end is after start
- start and end fall on the same day (in the business time zone, default Asia/Kolkata)
- the resource is open that day and the booking is inside the opening hours
- length is between the minimum and maximum duration
- start and end are multiples of the slot step
- start is not further ahead than the maximum advance days
- the resource is active
- no overlap with another confirmed booking of the same resource. This is enforced by a PostgreSQL exclusion constraint, so two simultaneous requests can never both succeed. Back to back bookings (one ends when the next starts) are allowed.

### GET /bookings/mine
All bookings of the signed in user, latest first.

### GET /bookings/calendar
Query: `from`, `to` (ISO dates, range up to 93 days), optional `resourceId`.
Confirmed bookings of everyone that overlap the range.

### GET /bookings (admin)
Query (all optional): `date` (YYYY-MM-DD), `resourceId`, `status` (`confirmed` for upcoming, `completed` for finished, `cancelled`), `search` (user name or email), `needsAttention` (`true` for confirmed future bookings on disabled resources).
Latest first, at most 500 rows.

### GET /bookings/:id
Owner or admin only.

### GET /bookings/:id/history
Owner or admin. Every change to the booking, oldest first: `id`, `action` (`created`, `edited`, `cancelled`), `details`, `changedBy`, `createdAt`.

### POST /bookings
Body: `resourceId`, `startTime`, `endTime`, `purpose` (optional, max 255). Response 201.

### PUT /bookings/:id
Body: `startTime`, `endTime`, `purpose`. The resource cannot be changed. Owner or admin, only for confirmed bookings that have not started.

### PATCH /bookings/:id/cancel
Owner or admin, only for confirmed bookings that have not started. The slot becomes free again.

## Other

### GET /health
`{ "status": "ok" }` once the database answers.
