# EVE Healthcare Diagnostic Booking Backend

A simple REST API that lets users sign up, book diagnostic tests at centres, and complete a **simulated** payment flow.

Built with **Node.js + TypeScript + Express + PostgreSQL (Neon)**.


---

## How to run the project locally

### Prerequisites

- Node.js 20+
- A free [Neon](https://neon.tech) PostgreSQL database (or any PostgreSQL URL)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/Sandigupta/Healthcare-Diagnostic-Booking-Backend.git
cd Healthcare-Diagnostic-Booking-Backend

# 2. Install dependencies
npm install

# 3. Create your env file
cp .env.example .env
```

Edit `.env` and set at least:

```env
DATABASE_URL=postgresql://...your-neon-url...
JWT_SECRET=some-long-secret-at-least-16-chars
JWT_EXPIRES_IN=1d
PORT=3000
NODE_ENV=development
```

```bash
# 4. Create tables
npm run db:migrate

# 5. Add sample centres and tests (optional but helpful)
npm run db:seed

# 6. Start the server
npm run dev
```

Server runs at: **http://localhost:3000**  
Health check: **http://localhost:3000/health**

### Run tests

```bash
npm test
```

With a real `DATABASE_URL` in `.env`, all unit + API tests run (last run: **32 passed**).

---

## API endpoints and example requests

Protected routes need this header after login:

```http
Authorization: Bearer <accessToken>
```

### Auth

**Signup** — `POST /api/auth/signup`

```json
{
  "name": "Sandeep Gupta",
  "email": "sandeep@example.com",
  "password": "password123"
}
```

**Login** — `POST /api/auth/login`

```json
{
  "email": "sandeep@example.com",
  "password": "password123"
}
```

Response includes `accessToken`.

### Centres

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/api/centres?page=1&limit=10` | No |
| GET | `/api/centres/:id` | No |
| POST | `/api/centres` | Yes |
| GET | `/api/centres/:id/tests` | No |
| POST | `/api/centres/:id/tests` | Yes |

**Create centre**

```json
{
  "name": "EVE Labs Koramangala",
  "location": "Bangalore, Karnataka"
}
```

**Attach a test + price to a centre**

```json
{
  "testId": 1,
  "price": 499
}
```

### Tests

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/api/tests?page=1&limit=10` | No |
| GET | `/api/tests/:id` | No |
| POST | `/api/tests` | Yes |

**Create test**

```json
{
  "name": "Complete Blood Count",
  "description": "CBC with differential"
}
```

### Bookings

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/bookings` | Yes |
| GET | `/api/bookings` | Yes |
| GET | `/api/bookings/:id` | Yes |
| PATCH | `/api/bookings/:id/cancel` | Yes |

**Create booking** (amount is calculated by the server from centre price)

```json
{
  "testId": 1,
  "centreId": 1,
  "appointmentDateTime": "2026-10-15T10:00:00.000Z"
}
```

### Payments

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/payments` | Yes |
| POST | `/api/payments/webhook` | No |

**Pay for a booking**

```json
{
  "bookingId": 1,
  "forceOutcome": "SUCCESS"
}
```

(`forceOutcome` is only for local/demo testing.)

**Webhook example**

```json
{
  "eventId": "evt_12345",
  "paymentId": "pay_123",
  "bookingId": 1,
  "status": "SUCCESS"
}
```

### Simple happy path

```text
1. Signup → Login (copy token)
2. Create centre + create test + attach test with price
3. Create booking
4. Pay for booking → booking becomes CONFIRMED
```

More detail for each feature: see [`docs/`](docs/).

---

## Database / schema design

PostgreSQL tables:

| Table | Purpose |
|---|---|
| `users` | Accounts (email unique, password hashed) |
| `diagnostic_centres` | Labs / centres |
| `diagnostic_tests` | Test catalog (CBC, lipid, etc.) |
| `centre_tests` | Which centre offers which test **and at what price** |
| `bookings` | User bookings (amount + status) |
| `payments` | Payment records for bookings |
| `webhook_events` | Stores webhook `eventId` so the same event is not processed twice |

### Relationships (simple view)

```text
User ─── creates ───> Booking ─── has ───> Payment

Centre ──┐
         ├── centre_tests (price lives here)
Test   ──┘
```

### Booking statuses

`PENDING` → `CONFIRMED` or `FAILED` or `CANCELLED`

### Why price is on `centre_tests`

The same test can cost different amounts at different centres. When a booking is created, the server copies that price into the booking so the user cannot send a fake amount.

---

## Important assumptions

1. **No admin panel / roles** — any logged-in user can create centres and tests. Good enough for this assignment.
2. **Payments are fake** — there is no Stripe/Razorpay. The API pretends payment succeeded or failed.
3. **Webhook has no secret signature** — it is a practice endpoint with validation + rate limiting only.
4. **One user can only see their own bookings** — checking someone else’s booking returns 403.
5. **Docker is not used** — local run is with Node + Neon only (as planned for V1).
6. **Appointment time must be in the future.**
7. **If a booking is already cancelled, a late webhook will not force it to CONFIRMED.**

---

## What I would improve with more time

(Written from a fresher / real-project learning point of view.)

1. **Add Docker** so anyone can start the app with one command, without manually setting up a cloud database.
2. **Add API docs UI (Swagger)** so testers can try endpoints in the browser without Postman.
3. **Add a real payment provider** (like Razorpay/Stripe) instead of a simulated payment.
4. **Send email/SMS** when a booking is confirmed or cancelled.
5. **Add admin login** so only admins can create centres/tests, not every user.
6. **Build a small frontend** (React) so the flow is clickable for demos.
7. **Better background retries** for webhooks if the server is temporarily down.
8. **More security on webhooks** (verify the request really came from the payment provider).

---

## Project structure

```text
src/           API source code
tests/         Unit + API tests
docs/          Extra feature explanations
drizzle/       Database migration SQL
package.json   Dependencies & scripts
.env.example   Environment template
```

---

## License

MIT
