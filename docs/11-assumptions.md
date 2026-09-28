# Assumptions

Documented design decisions for V1:

1. **No admin role** — any authenticated user can create centres/tests and attach offers. Enough for the assignment without building RBAC.
2. **Price on `centre_tests`** — supports per-centre pricing; booking stores a snapshot amount.
3. **Payment simulation** — `simulatePaymentOutcome()` defaults to ~70% success; `forceOutcome` allowed in development/test only.
4. **Webhook unauthenticated** — treated as a simulated provider endpoint; secured by validation + rate limits (not HMAC in V1).
5. **In-process webhook retries** — max 3 attempts with short delay; no Redis/Celery/queues.
6. **Neon WebSocket pool** — chosen so Drizzle transactions work (HTTP driver alone is insufficient).
7. **Appointment must be in the future** — extra guard beyond PRD minimum.
8. **Webhook does not revive cancelled bookings** — only transitions from `PENDING`.
9. **Integration tests are DB-gated** — CI/local without Neon still get unit coverage.
10. **V2 explicitly deferred** — Docker, Redis, Swagger, real PSP, notifications, frontend.

## Future improvements (not implemented)

- Docker Compose local stack
- OpenAPI/Swagger
- Redis-backed rate limits / caching
- Background workers for webhook retries
- Webhook signature verification
- Real payment provider
- Admin roles and centre ownership
