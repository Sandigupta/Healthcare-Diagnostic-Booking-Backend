# Testing

## Stack

Vitest + Supertest. Config: [`vitest.config.ts`](../vitest.config.ts). Setup: [`tests/setup.ts`](../tests/setup.ts).

## Layout

```text
tests/
  unit/           status, pagination, jwt, simulate, rate-limit
  auth/           signup/login/JWT protection
  centres/        centres + tests + offers
  bookings/       create, ownership, cancel
  payments/       success/fail/guards
  webhooks/       process + idempotent duplicate
  helpers/        DB truncate + HTTP helpers
```

## How to run

```bash
npm test
```

### Without Neon

Unit tests run; integration suites use `describe.runIf(hasDatabaseUrl())` and are **skipped** if only the localhost placeholder URL is present.

### With Neon

1. Put a real `DATABASE_URL` (and ideally `TEST_DATABASE_URL`) in `.env`
2. `npm run db:migrate`
3. `npm test`

Optionally set `EVE_RUN_DB_TESTS=1`.

## Critical webhook case

Covered in [`tests/webhooks/webhooks.test.ts`](../tests/webhooks/webhooks.test.ts):

1. Send webhook → payment created, booking confirmed  
2. Send same `eventId` again → `duplicate: true`, still one payment, status unchanged  

## Honesty note

Documented results must match an actual `npm test` run. Do not claim integration tests passed unless a real database was configured for that run.
