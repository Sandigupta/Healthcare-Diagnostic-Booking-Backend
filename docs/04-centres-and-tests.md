# Centres and tests

Centres and tests are a many-to-many relationship. **Price belongs on the join** (`centre_tests`).

## Centres

### `GET /api/centres?page=1&limit=10`

Public. Paginated list.

### `GET /api/centres/:id`

Public. Single centre or `404 CENTRE_NOT_FOUND`.

### `POST /api/centres` (auth)

```json
{ "name": "EVE Labs Koramangala", "location": "Bangalore, Karnataka" }
```

Any authenticated user may create centres (no admin role in V1).

### `GET /api/centres/:id/tests`

Public. Returns offerings with `price`, `testName`, etc.

### `POST /api/centres/:id/tests` (auth)

Attach an existing test to a centre with a price:

```json
{ "testId": 1, "price": 499 }
```

Duplicate offer → `409 CENTRE_TEST_EXISTS`.

## Tests

### `GET /api/tests` / `GET /api/tests/:id`

Public catalog.

### `POST /api/tests` (auth)

```json
{ "name": "Complete Blood Count", "description": "CBC with differential" }
```

## Example: centre tests response

```json
{
  "data": [
    {
      "id": 1,
      "centreId": 1,
      "testId": 1,
      "price": "499.00",
      "testName": "Complete Blood Count",
      "testDescription": "CBC with differential",
      "createdAt": "..."
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

## Code map

- [`src/modules/centres/`](../src/modules/centres/)
- [`src/modules/tests/`](../src/modules/tests/)
