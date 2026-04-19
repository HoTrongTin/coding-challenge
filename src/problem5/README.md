# Problem 5: Resource Management API

A RESTful CRUD backend built with **Express.js**, **TypeScript**, **Prisma**, and **PostgreSQL**, following **Clean Architecture** principles.

---

## Table of Contents

- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
  - [Response Format](#response-format)
  - [API Documentation](#api-documentation)
    - [Resources](#resources)
      - [Create Resource](#create-resource)
      - [List Resources](#list-resources)
      - [Get Resource by ID](#get-resource-by-id)
      - [Update Resource](#update-resource)
      - [Delete Resource](#delete-resource)
- [Development Guide](#development-guide)
  - [Configuration](#configuration)
  - [Running with Docker](#running-with-docker)
  - [Running Locally](#running-locally)
  - [Running Tests](#running-tests)
- [Assumptions](#assumptions)

---

## Requirements

| Tool | Minimum version |
|------|----------------|
| Node.js | 24 |
| npm | 10 |
| Docker | 24 |
| Docker Compose | v2 |

---

## Quick Start

**1. Copy environment variables**

```bash
cp .env.example .env
```

**2. Start the API and database**

```bash
docker compose up --build
```

The API will be available at **http://localhost:3000**.

**3. (Optional) Seed sample data**

```bash
npm run prisma:seed
```

**4. (Optional) Run all tests** — requires `TEST_DATABASE_URL` in `.env`

```bash
npm test
```

---

## Architecture

The project follows **Clean Architecture**, enforcing a strict inward dependency rule:

```
┌──────────────────────────────────────────────────────────────────┐
│  Presentation  │  HTTP layer: Express controllers, Zod schemas   │
├──────────────────────────────────────────────────────────────────┤
│  Application   │  Use Cases + DTOs (business orchestration)      │
├──────────────────────────────────────────────────────────────────┤
│  Domain        │  ResourceEntity, IResourceRepository interface  │
├──────────────────────────────────────────────────────────────────┤
│  Infrastructure│  Prisma implementation of IResourceRepository   │
└──────────────────────────────────────────────────────────────────┘
         ↑  All dependencies point inward only  ↑
```

---

## Project Structure

```
src/problem5/
├── src/
│   ├── domain/resource/          # Entity, repository interface, domain errors
│   ├── application/resource/     # Use cases, DTOs, mapper
│   ├── infrastructure/           # Prisma client, repository implementation
│   ├── presentation/             # Express controllers, routes, Zod schemas, middlewares
│   ├── shared/                   # Base errors, API response helpers
│   ├── app.ts                    # Express app factory
│   └── server.ts                 # Entry point + graceful shutdown
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Migration history (tracked in git)
│   └── seed.ts                   # Sample data
├── tests/
│   ├── factories/                # Faker.js data factories
│   ├── unit/                     # Use case tests with mocked repositories
│   └── integration/              # Full HTTP tests against a real test database
├── Dockerfile                    # Multi-stage build (Node 24 Alpine)
├── docker-compose.yml            # API + PostgreSQL services
└── .env.example                  # Environment variable reference
```

---

## API Reference

**Base URL:** `http://localhost:3000`

### Response Format

All endpoints return a consistent JSON envelope.

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | `true` on success, `false` on error |
| `data` | object \| array \| null | The response payload |
| `message` | string | Human-readable status message |
| `meta` | object | Pagination info (list endpoints only) |

**Success — single item**
```json
{
  "success": true,
  "message": "Resource fetched successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Server Node Alpha"
  }
}
```

**Success — list**
```json
{
  "success": true,
  "message": "Resources fetched successfully",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Server Node Alpha"
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

**Error**
```json
{
  "success": false,
  "data": null,
  "message": "Validation failed: type: Required"
}
```

---

### API Documentation

#### Resources

##### Create Resource

`POST http://localhost:3000/api/resources`

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Resource name (max 255 chars) |
| `type` | string | ✅ | Category/type (max 100 chars) |
| `description` | string \| null | ❌ | Description (max 1000 chars) |
| `status` | `ACTIVE` \| `INACTIVE` | ❌ | Default: `ACTIVE` |
| `quantity` | integer ≥ 0 | ❌ | Default: `0` |
| `metadata` | object \| null | ❌ | Arbitrary key-value pairs |

**Sample request:**

```bash
curl -X POST http://localhost:3000/api/resources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Server Node Alpha",
    "type": "compute",
    "description": "Primary compute node",
    "quantity": 5,
    "metadata": { "region": "us-east-1" }
  }'
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Resource created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Server Node Alpha",
    "type": "compute",
    "status": "ACTIVE",
    "quantity": 5,
    "metadata": { "region": "us-east-1" },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

##### List Resources

`GET http://localhost:3000/api/resources`

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | integer ≥ 1 | Page number (default: `1`) |
| `limit` | integer 1–100 | Items per page (default: `10`) |
| `search` | string | Case-insensitive search in name and description |
| `type` | string | Exact match on type |
| `status` | `ACTIVE` \| `INACTIVE` | Filter by status |

**Sample request:**

```bash
curl "http://localhost:3000/api/resources?type=compute&status=ACTIVE&page=1&limit=5"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Resources fetched successfully",
  "data": [ { "id": "...", "name": "Server Node Alpha", "type": "compute", "status": "ACTIVE" } ],
  "meta": { "total": 12, "page": 1, "limit": 5, "totalPages": 3 }
}
```

##### Get Resource by ID

`GET http://localhost:3000/api/resources/:id`

**Sample request:**

```bash
curl http://localhost:3000/api/resources/550e8400-e29b-41d4-a716-446655440000
```

**Response:** `200 OK` · `400 invalid UUID` · `404 not found`

```json
{
  "success": true,
  "message": "Resource fetched successfully",
  "data": { "id": "550e8400-e29b-41d4-a716-446655440000", "name": "Server Node Alpha", "type": "compute", "status": "ACTIVE" }
}
```

##### Update Resource

`PUT http://localhost:3000/api/resources/:id`

All fields are optional — only supplied fields are updated.

**Sample request:**

```bash
curl -X PUT http://localhost:3000/api/resources/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{ "status": "INACTIVE", "quantity": 0 }'
```

**Response:** `200 OK` · `400 invalid UUID or body` · `404 not found`

```json
{
  "success": true,
  "message": "Resource updated successfully",
  "data": { "id": "550e8400-e29b-41d4-a716-446655440000", "status": "INACTIVE", "quantity": 0 }
}
```

##### Delete Resource

`DELETE http://localhost:3000/api/resources/:id`

Performs a **soft delete** — sets `deletedAt`; the resource is excluded from all reads but never physically removed.

**Sample request:**

```bash
curl -X DELETE http://localhost:3000/api/resources/550e8400-e29b-41d4-a716-446655440000
```

**Response:** `200 OK` · `400 invalid UUID` · `404 not found`

```json
{ "success": true, "message": "Resource deleted successfully", "data": null }
```


---

## Development Guide

### Configuration

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP port | `3000` |
| `NODE_ENV` | Runtime environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | see `.env.example` |
| `TEST_DATABASE_URL` | Dedicated test database | see `.env.example` |

Connection string format:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

### Running with Docker

```bash
docker compose up --build          # Start (with rebuild)
docker compose up --build -d       # Start in background
docker compose logs -f api         # Stream API logs
docker compose down                # Stop all services
docker compose down -v             # Stop and delete all data
```

### Running Locally

**Prerequisites:** A running PostgreSQL instance at `DATABASE_URL`.

```bash
npm install
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Apply migrations
npm run prisma:seed        # (Optional) seed sample data
npm run dev                # Start with hot-reload
```

Other commands:

```bash
npm run build              # Compile TypeScript → dist/
npm start                  # Run compiled production bundle
npm run prisma:studio      # Visual database browser
```

### Running Tests

> **Prerequisite:** Integration tests require `TEST_DATABASE_URL` to be set in your `.env`. The Vitest global setup automatically provisions the schema via `prisma db push` — no manual migration needed.

```bash
npm test                   # All tests (unit + integration)
npm run test:unit          # Unit tests only — no DB required
npm run test:integration   # Integration tests — requires TEST_DATABASE_URL in .env
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report (output: coverage/)
```

---

## Assumptions

1. **No authentication** — all endpoints are publicly accessible as specified.
2. **Soft delete** — resources are never physically removed; `deletedAt` is set instead. This preserves referential integrity and audit history.
3. **Resource domain** — the entity uses generic fields (`name`, `type`, `description`, `status`, `quantity`, `metadata`) that can represent any kind of managed resource.
4. **Pagination** — the list endpoint defaults to page 1 / limit 10 and caps the limit at 100 to protect against large payload abuse.
5. **Test isolation** — integration tests run against a separate `TEST_DATABASE_URL` and truncate all data `beforeEach` to guarantee clean state.
