# Architecture

## Purpose

EVE V1 is a single Express REST API. Clients authenticate with JWT, browse diagnostic centres/tests, create bookings, and complete a **simulated** payment (or receive a simulated provider webhook).

## Request path

```text
HTTP request
  → helmet / cors / JSON body parser
  → pino-http request log
  → general rate limit
  → route module
       → optional auth middleware
       → Zod validation middleware
       → route-specific rate limit (auth/payments/webhook)
       → service function (business logic)
       → Drizzle → Neon PostgreSQL
  → centralized error handler
```

## Layout

```text
src/
  config/env.ts          validated environment
  db/                    Drizzle client + schema + migrate/seed
  middleware/            auth, validation, errors, rate limits
  modules/
    auth/
    centres/
    tests/
    bookings/
    payments/
  utils/                 logger, jwt, pagination, AppError
  app.ts                 Express app factory
  server.ts              process entrypoint
```

Modules stay flat: **routes + Zod schema + service**. No repository/controller layers.

## Design goals (from PRD)

- Server-owned booking amounts (never trust client price)
- Explicit booking status transitions
- Payment + booking updates in one DB transaction
- Webhook idempotency via unique `eventId`
- Bounded in-process webhook retries (no Celery)
- Consistent `{ data }` / `{ error }` envelopes
