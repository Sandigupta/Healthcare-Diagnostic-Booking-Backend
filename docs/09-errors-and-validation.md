# Errors and validation

## Validation (Zod)

Every mutating/query input goes through the shared `validate(schema, part)` middleware (`body` | `query` | `params`).

Failure → `400`:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {}
  }
}
```

## Error envelope

All errors use:

```json
{
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "Booking not found"
  }
}
```

`AppError(statusCode, code, message, details?)` is thrown from services; `errorHandler` maps it to HTTP.

## Common status codes

| HTTP | When |
|---|---|
| 400 | Validation / business input issues |
| 401 | Auth missing/invalid |
| 403 | Authenticated but not owner |
| 404 | Resource missing |
| 409 | Conflicts / illegal status transitions |
| 429 | Rate limited |
| 500 | Unexpected / webhook retries exhausted |

Internal DB errors are not leaked; clients get a generic 500 message while Pino logs the detail.
