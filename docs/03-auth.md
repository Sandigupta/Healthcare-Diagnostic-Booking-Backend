# Authentication

## Endpoints

### `POST /api/auth/signup`

Request:

```json
{
  "name": "Sandeep Gupta",
  "email": "sandeep@example.com",
  "password": "password123"
}
```

Response `201`:

```json
{
  "data": {
    "id": 1,
    "name": "Sandeep Gupta",
    "email": "sandeep@example.com",
    "createdAt": "2026-09-29T00:00:00.000Z"
  }
}
```

Rules:

- Zod validates name/email/password (password min 8)
- Email stored lowercased; unique → `409 EMAIL_ALREADY_EXISTS`
- Password hashed with bcrypt (10 rounds); never returned

### `POST /api/auth/login`

Request:

```json
{
  "email": "sandeep@example.com",
  "password": "password123"
}
```

Response `200`:

```json
{
  "data": {
    "accessToken": "<jwt>"
  }
}
```

Wrong email/password → `401 INVALID_CREDENTIALS` (same message either way).

## JWT middleware

Protected routes use `Authorization: Bearer <token>`.

Middleware verifies signature/expiry and sets `req.user = { userId, email }`.

| Case | Code |
|---|---|
| Missing/malformed header | `401 UNAUTHORIZED` |
| Bad signature | `401 INVALID_TOKEN` |
| Expired | `401 TOKEN_EXPIRED` |

Rate limit on signup/login: **5 requests / minute / IP** (raised in `NODE_ENV=test`).

## Code map

- [`src/modules/auth/`](../src/modules/auth/)
- [`src/middleware/auth.ts`](../src/middleware/auth.ts)
- [`src/utils/jwt.ts`](../src/utils/jwt.ts)
