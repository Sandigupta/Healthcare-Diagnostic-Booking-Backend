# Payments (simulated)

There is **no real payment gateway**. `POST /api/payments` simulates SUCCESS/FAILED and updates the booking in the same transaction.

## `POST /api/payments` (auth)

```json
{
  "bookingId": 101,
  "forceOutcome": "SUCCESS"
}
```

`forceOutcome` is accepted in `development` and `test` so demos/tests are deterministic. In production it is ignored; outcome comes from `simulatePaymentOutcome()` (~70% SUCCESS).

### Success path

1. Load booking; verify ownership
2. Booking must be `PENDING` (`409 PAYMENT_NOT_ALLOWED` otherwise)
3. Simulate outcome
4. Transaction: insert `payments` + set booking `CONFIRMED` or `FAILED`

Response `201`:

```json
{
  "data": {
    "payment": {
      "id": 1,
      "bookingId": 101,
      "paymentReference": "pay_...",
      "amount": "799.00",
      "status": "SUCCESS"
    },
    "booking": {
      "id": 101,
      "status": "CONFIRMED"
    }
  }
}
```

### Guardrails

| Case | Result |
|---|---|
| Other user’s booking | `403` |
| Cancelled / already paid | `409` |
| Missing booking | `404` |

Rate limit: **20 / minute / IP** (raised in test).

## Code map

- [`src/modules/payments/service.ts`](../src/modules/payments/service.ts) (`createPayment`)
- [`src/modules/payments/simulate.ts`](../src/modules/payments/simulate.ts)
