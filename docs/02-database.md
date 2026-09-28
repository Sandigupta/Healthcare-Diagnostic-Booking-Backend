# Database

## Provider

PostgreSQL on **Neon**, accessed with `@neondatabase/serverless` (WebSocket `Pool`) so Drizzle **transactions** work for payments/webhooks.

## Tables

| Table | Role |
|---|---|
| `users` | Accounts; email unique; bcrypt hash only |
| `diagnostic_centres` | Centre name + location |
| `diagnostic_tests` | Test catalog |
| `centre_tests` | Many-to-many offer + **per-centre price** |
| `bookings` | User booking; amount snapshot; status |
| `payments` | Payment rows tied to bookings |
| `webhook_events` | Idempotency + retry metadata |

## Relationships

```text
users 1──* bookings
diagnostic_centres 1──* centre_tests *──1 diagnostic_tests
bookings 1──* payments
bookings 1──* webhook_events (optional FK)
```

## Important constraints

- `users.email` UNIQUE
- `centre_tests (centre_id, test_id)` UNIQUE
- `payments.payment_reference` UNIQUE
- `webhook_events.event_id` UNIQUE ← webhook idempotency
- Booking status enum: `PENDING | CONFIRMED | FAILED | CANCELLED`
- Payment status enum: `SUCCESS | FAILED`

## Migrations

SQL lives in [`drizzle/0000_init.sql`](../drizzle/0000_init.sql).

```bash
npm run db:migrate
npm run db:seed
```

Seed creates two centres, three tests, and several priced offers when the DB is empty.

## Why price is on `centre_tests`

The same test can cost different amounts at different centres. Booking amount is copied from the matching `centre_tests.price` at create time so later price edits do not rewrite history.
