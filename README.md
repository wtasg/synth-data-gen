# faked

Dependency-free fake data generation service built with Deno and TypeScript.

## Run

```sh
deno task dev
```

The server port comes from `.env`. The default backend listens on `http://localhost:16010`.

For the client:

```sh
deno task client:dev
```

The Vite client defaults to `http://localhost:16011` and proxies `/api` to the backend.

Run both together from the repo root:

```sh
deno task dev:all
```

## Environment

Copy `sample.env` to `.env` and adjust as needed.

```sh
cp sample.env .env
```

Default values:

```text
SERVER_HOST=0.0.0.0
SERVER_PORT=16010
CLIENT_HOST=0.0.0.0
CLIENT_PORT=16011
CLIENT_PREVIEW_PORT=16012
API_PROXY_HOST=127.0.0.1
API_PROXY_PORT=16010
```

## Architecture

```text
src/
  server/
  routes/
  generators/
  filters/
  random/
  datasets/
  validation/
  models/
  utils/

data/
  firstname/
  lastname/
  streets/
  postal/
  phone/
```

The HTTP layer is thin. Business logic lives in reusable generators under `src/generators`.

## API

Base URL: `/api/v1`

All endpoints accept `POST` requests with a JSON body.

### First Name

`POST /api/v1/firstname`

```json
{
  "gender": "male",
  "startsWith": "stu",
  "length": { "min": 5, "max": 10 },
  "seed": 123
}
```

```json
{
  "value": "Stuart"
}
```

### Last Name

`POST /api/v1/lastname`

```json
{
  "startsWith": "mc"
}
```

### Full Name

`POST /api/v1/fullname`

```json
{
  "gender": "female",
  "middleName": true,
  "surnameCount": 2,
  "startsWith": "ann*",
  "seed": 321
}
```

### Person

`POST /api/v1/person`

```json
{
  "gender": "male",
  "country": "US"
}
```

### Address

`POST /api/v1/address`

```json
{
  "country": "IN",
  "state": "Karnataka",
  "pin": "560*"
}
```

### Phone

`POST /api/v1/phone`

```json
{
  "country": "IN",
  "startsWith": "98*"
}
```

### Batch Dataset

`POST /api/v1/batch`

```json
{
  "count": 10,
  "selected": ["firstname", "lastname"],
  "requests": {
    "firstname": { "startsWith": "ann" },
    "lastname": { "startsWith": "mc" }
  }
}
```

The client record builder can export generated results as JSON or CSV.

## Wildcards

- `*` matches zero or more characters.
- Matching is case-insensitive by default.
- `startsWith`, `wildcard`, and other text filters support wildcard strings.
- No match returns a structured `400` error.

Example:

```json
{
  "error": {
    "code": "NO_MATCH",
    "message": "No first name matches pattern 'stuq*'."
  }
}
```

## Seed Behavior

Provide `seed` in any request for deterministic results. The same request body and seed produce the same response.

## Adding a Generator

1. Add or extend a dataset under `data/`.
2. Implement a generator in `src/generators/`.
3. Register a route in `src/routes/register.ts`.

## Testing

```sh
deno task test
```

Client tests:

```sh
deno task client:test
```

Lint both projects:

```sh
deno task lint
```

## Docker

Use Docker Compose to run both services with the same `.env` file:

```sh
docker compose up --build
```

This starts:

- backend on `SERVER_PORT` (default `16010`)
- client on `CLIENT_PORT` (default `16011`)

The client container is production-oriented: it builds the Vite app once and serves the static output through Nginx, with `/api` proxied to the backend container.
