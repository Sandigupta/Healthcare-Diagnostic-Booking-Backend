# Webhooks

## `POST /api/payments/webhook`

Simulates an external provider callback. No JWT; protected by validation + rate limiting (**60 / minute / IP**).

Request:

```json
{
  "eventId": "evt_12345",
  "paymentId": "pay_123",
  "bookingId": 101,
  "status": "SUCCESS"
}
```

Response `200`:

```json
{
  "data": {
    "received": true,
    "duplicate": false,
    "eventId": "evt_12345",
    "processedAt": "..."
  }
}
```

## Idempotency

`webhook_events.event_id` is **UNIQUE**.

1. First delivery with `eventId` → process payment + booking, set `processedAt`
2. Same `eventId` again → return `duplicate: true`, **no** second payment, **no** status corruption

If a payment row with `paymentReference = paymentId` already exists, it is updated; otherwise one is created.

Booking status only changes when current status is still `PENDING` (so cancelled bookings are not resurrected).

## Retry handling (V1, in-process)

On unexpected/transient failures inside processing:

1. Increment `retryCount` / `lastAttemptAt` on the event row
2. Wait briefly (`WEBHOOK_RETRY_DELAY_MS * attempt`)
3. Retry up to `WEBHOOK_MAX_RETRIES` (3)
4. If still failing → `500 WEBHOOK_PROCESSING_FAILED`

Domain/client errors (`4xx` `AppError`) are **not** retried.

Retries remain idempotent: a successfully processed `eventId` short-circuits on later attempts.

## Logging

Structured events include `webhook_received`, `webhook_processed`, `webhook_duplicate`, `webhook_processing_failed`.

## Code map

- [`src/modules/payments/service.ts`](../src/modules/payments/service.ts) (`handleWebhook`)
- [`src/modules/payments/simulate.ts`](../src/modules/payments/simulate.ts) (retry constants)
