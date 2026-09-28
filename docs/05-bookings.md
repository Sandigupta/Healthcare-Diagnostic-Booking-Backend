# Bookings

All booking routes require JWT. Users can only read/cancel **their own** bookings (`403 FORBIDDEN` otherwise).

## Status machine

```text
PENDING ──► CONFIRMED
   │
   ├──► FAILED
   └──► CANCELLED

CONFIRMED ──► CANCELLED

FAILED / CANCELLED → (terminal)
```

Invalid transitions → `409 INVALID_STATUS_TRANSITION`.

## `POST /api/bookings`

```json
{
  "testId": 1,
  "centreId": 2,
  "appointmentDateTime": "2026-10-01T10:00:00.000Z"
}
```

Server responsibilities:

1. Validate input (Zod)
2. Ensure centre and test exist
3. Ensure centre offers the test (`centre_tests`)
4. Copy `price` → booking `amount` (ignore any client `amount`)
5. Require appointment in the future
6. Insert with status `PENDING`

Response `201`:

```json
{
  "data": {
    "id": 10,
    "userId": 1,
    "testId": 1,
    "centreId": 2,
    "appointmentDateTime": "2026-10-01T10:00:00.000Z",
    "amount": "799.00",
    "status": "PENDING",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

If the centre does not offer the test → `400 TEST_NOT_OFFERED`.

## `GET /api/bookings`

Paginated list of the authenticated user’s bookings only.

## `GET /api/bookings/:id`

Ownership checked. Missing → `404`; other user’s → `403`.

## `PATCH /api/bookings/:id/cancel`

Allowed from `PENDING` or `CONFIRMED` only.

## Code map

- [`src/modules/bookings/service.ts`](../src/modules/bookings/service.ts)
- [`src/modules/bookings/status.ts`](../src/modules/bookings/status.ts)
