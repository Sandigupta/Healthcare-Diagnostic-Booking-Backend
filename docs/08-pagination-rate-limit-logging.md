# Pagination, rate limiting, logging

## Pagination

Query params on collection GETs (`/centres`, `/tests`, `/bookings`, centre tests):

| Param | Default | Max |
|---|---|---|
| `page` | 1 | — (positive int) |
| `limit` | 10 | 100 |

Response shape:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

Invalid values → `400 VALIDATION_ERROR`.

## Rate limiting

Implemented with `express-rate-limit` (in-memory, per process — fine for V1).

| Scope | Limit |
|---|---|
| General API | 100 / min / IP |
| Auth signup/login | 5 / min / IP |
| Payments | 20 / min / IP |
| Webhook | 60 / min / IP |

Exceeded → `429` with `RATE_LIMIT_EXCEEDED`.

In `NODE_ENV=test`, auth/payment/general limits are raised so suites do not flake; a dedicated unit test uses a strict limiter (`max: 2`) to assert `429` behaviour.

## Structured logging (Pino)

- Request logging via `pino-http` (health checks ignored)
- Domain events: `user_signed_up`, `booking_created`, `payment_processed`, `webhook_*`, etc.
- Redaction removes passwords, `Authorization`, secrets from logs
- Pretty transport only in `development`

Do not log JWTs, password hashes, or `DATABASE_URL`.
