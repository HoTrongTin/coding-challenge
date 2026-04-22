# Implementation Plan – Live Scoreboard

> Detailed API specification, data schemas, caching design, and testing criteria.  
> Read [ARCHITECTURE.md](file:///Users/hotrongtin/Documents/99tech-interview/coding-challenge/src/problem6/ARCHITECTURE.md) first for the high-level design.

---

## Table of Contents

1. **[Data Model](#1-data-model)**
   - [1.1 SQL Schema](#11-sql-schema)
   - [1.2 Action Type Configuration](#12-action-type-configuration)
2. **[Redis Key Design](#2-redis-key-design)**
3. **[API Specification](#3-api-specification)**
   - [3.1 Issue Token](#31-external-issue-action-token-post)
   - [3.2 Update Score (POST)](#32-update-score-post)
   - [3.3 Top Leaderboard (GET)](#33-top-leaderboard-get)
   - [3.4 Live Update Leaderboard (WSS)](#34-live-stream-wss)
4. **[Testing & Verification](#4-testing--verification)**
   - [4.1 Unit Tests](#41-unit-tests)
   - [4.2 Integration Tests](#42-integration-tests)
   - [4.3 Security Tests](#43-security-tests)
   - [4.4 Stress Tests](#44-stress-tests)
   - [4.5 Resilience Tests](#45-resilience-tests)

---

## 1. Data Model

### 1.1 SQL Schema

```sql
-- Assumed to exist: users table
CREATE TABLE users (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name VARCHAR(50) NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per user — current score
CREATE TABLE scores (
  user_id    UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  score      BIGINT      NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_scores_score ON scores(score DESC);

-- Immutable append-only audit log
CREATE TABLE score_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id),
  action_type  VARCHAR(50) NOT NULL,
  delta        INT         NOT NULL,
  score_before BIGINT      NOT NULL,
  score_after  BIGINT      NOT NULL,
  action_token UUID        NOT NULL UNIQUE,
  ip_address   INET,
  outcome      VARCHAR(20) NOT NULL,  -- SUCCESS | REJECTED | ERROR
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_score_events_user_time ON score_events(user_id, created_at DESC);
```

**Design notes:**
- **Atomic Writes**: Every score change involves two writes: updating the `scores` table and appending to `score_events`. **These MUST be wrapped in a single database transaction** to prevent partial updates.
- `scores` has one row per user, always the current score. 
- `score_events` is append-only and never changed. Used for fraud checks, history replay, and rollbacks.
- `score_before` is captured at write time so a score can be rebuilt without replaying the entire log.

---

### 1.2 Action Type Configuration

Score deltas are defined server-side in configuration. Example:

```json
{
  "COMPLETE_TUTORIAL":  50,
  "FINISH_LEVEL":      100,
  "DAILY_LOGIN":        10,
  "ACHIEVEMENT_UNLOCK": 200
}
```

The client only sends `actionType`. The server looks up the delta. This prevents clients from submitting arbitrary point amounts.

---

## 2. Redis Key Design

| Key | Type | TTL | Purpose |
|-----|------|-----|---------|
| `scoreboard:ranking` | Sorted Set | None | Live leaderboard. Member = `userId`, score = points. Used for all top-N reads and position lookups. |
| `scoreboard:user:{userId}` | Hash | None | User display name and avatar URL. Populated when the leaderboard is first built; cleared when the user updates their profile. |
| `action:{token}` | String | 300 s | Token value: `{userId}:{actionType}`. Written by the upstream action service. Consumed in one step when used. Expires automatically after 5 minutes. |
| `rate:{userId}` | Sorted Set | 60 s | Sliding-window rate limit. Stores request timestamps; old entries are removed on each check. |
| `scoreboard:events` *(channel)* | Pub/Sub | N/A | Broadcast channel. Servers publish here after a score update; all servers subscribe and relay to their WebSocket clients. |

---

## 3. API Specification (v1)

### Base URL

```
{DOMAIN_NAME}/api/v1
```

### 3.1 Issue Action Token (POST)

> This endpoint is implemented in the **Action Service**, not this module. It is included here to define the contract between the two services.

`POST /actions/start` — The client calls this when beginning an action (e.g., tutorial, level).

**Auth:** Bearer JWT required.

**Request Body**
```json
{
  "actionType": "COMPLETE_TUTORIAL"
}
```

**Expected Outcome:**
1. The Action Service validates the user and action type.
2. It generates a unique `actionToken`.
3. It writes a key `action:{token}` to shared Redis with a 5-minute TTL.
4. It returns the token to the client.

**Response Body (200 OK)**
```json
{
  "actionToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 3.2 Update Score (POST)

`POST /scores/update` — Validates the action token and adds the server-determined score delta.

**Auth:** Bearer JWT required.

**Request Body**
```json
{
  "actionToken": "550e8400-e29b-41d4-a716-446655440000",
  "actionType": "COMPLETE_TUTORIAL"
}
```

**Response Codes**

| Code | Meaning |
|------|---------|
| `200 OK` | Score updated successfully. |
| `400 Bad Request` | Missing or malformed fields. |
| `401 Unauthorized` | JWT missing, invalid, or expired. |
| `403 Forbidden` | Token missing, expired, already consumed, or user mismatch. |
| `429 Too Many Requests` | Per-user rate limit exceeded. |
| `500 Internal Server Error` | DB write failure. |

**Response Body (200 OK)**
```json
{
  "newScore": 1250,
  "rank": 3,
  "deltaApplied": 50
}
```

---

### 3.3 Top Leaderboard (GET)

`GET /scores/top` — Returns the current top-10 leaderboard, served from Redis.

**Auth:** None (public endpoint).

**Query Params:** `limit` (optional, default `10`, max `100`).

**Response Body (200 OK)**
```json
{
  "leaderboard": [
    { "rank": 1, "userId": "u_abc", "displayName": "Alice", "score": 9800 },
    { "rank": 2, "userId": "u_def", "displayName": "Bob",   "score": 8750 },
    // ... rest of top 10
  ]
}
```

---

### 3.4 Live Update Leaderboard (WSS)

`WSS /ws/scoreboard` — WebSocket endpoint for live leaderboard updates. The server pushes `SCOREBOARD_UPDATE` messages whenever the top-10 changes.

**Auth:** JWT sent as a query parameter on connect (`?token=<jwt>`) or in the first message.

**Server → Client message format**
```json
{
  "event": "SCOREBOARD_UPDATE",
  "leaderboard": [
    { "rank": 1, "userId": "u_abc", "displayName": "Alice", "score": 9800 },
    // ... rest of top 10
  ]
}
```

The server sends the current top-10 immediately on connect. The client should reconnect automatically with exponential back-off if the connection drops.

---

## 4. Testing & Verification

### Overview

| Layer | What to Test | Tooling |
|-------|-------------|---------|
| **Unit** | Token validation logic, score delta lookup, rate-limit sliding window, debounce timer | Vitest / Jest |
| **Integration** | Full endpoint flow with real Redis + DB; transaction rollback behavior; concurrency | Vitest + Testcontainers |
| **Security** | Auth enforcement, token replay prevention, ID spoofing | Vitest + Testcontainers |
| **Stress** | High-concurrency score updates; large WebSocket subscriber counts under load | k6 / Locust |
| **Resilience** | Instance restarts, Redis downtime, WebSocket reconnects | k6 / manual |

---

### 4.1 Unit Tests

Isolated logic with no external dependencies. **Target coverage: >80%**.

Focus areas:
- Token validation logic (issuance vs. consumption).
- Score delta resolution from server-side config.
- Rate-limit sliding window calculations.
- WebSocket broadcast debounce and throttling logic.

---

### 4.2 Integration Tests

Full endpoint flows with real PostgreSQL and Redis (via **Testcontainers**).

| # | What | Expected |
|---|------|----------|
| T-07 | Valid request end-to-end | DB score updated; Redis ranking updated; `200 OK` with new rank |
| T-08 | DB write fails mid-transaction | `score_events` NOT written; Redis NOT updated; `5xx` returned |
| T-09 | Two users update scores simultaneously | Both scores recorded with no lost writes; ranks correct |
| T-10 | Rate limit enforced with real Redis | (N+1)th request returns `429` within the window |
| T-11 | Token consumed, same request retried immediately | Second attempt returns `403`; score unchanged |

---

### 4.3 Security Tests

Auth and anti-abuse scenarios. Run as integration tests against real dependencies.

| # | What | Expected |
|---|------|----------|
| T-12 | Valid JWT + valid unused token | `200 OK`, score applied |
| T-13 | Valid JWT + token already consumed | `403 Forbidden` |
| T-14 | Valid JWT + token issued to a different user | `403 Forbidden` |
| T-15 | Score update with no action token in body | `403 Forbidden` |
| T-16 | ID Spoofing: JWT for User A, token issued to User B | `403 Forbidden` |

---

### 4.4 Stress Tests

High-concurrency and high-density scenarios.

| # | What | Expected |
|---|------|----------|
| T-17 | 1,000 concurrent score update requests | P95 response time < 200ms; zero transaction failures |
| T-18 | 10,000 active WebSocket connections; one score update | Broadcast push latency < 500ms for all clients |
| T-19 | 50 score updates arrive within one 200ms debounce window | Debounce mechanism ensures only **one** WebSocket push event is triggered |

---

### 4.5 Resilience Tests

Failure and recovery scenarios.

| # | What | Expected |
|---|------|----------|
| T-20 | Redis becomes temporarily unavailable during a request | Request fails with `5xx` before reaching DB write — token cannot be consumed, so no score is applied |
| T-21 | API instance restarts with data in DB | Redis ranking rebuilt from DB on warm-up; health check stays down until ready |
| T-22 | Client WebSocket connection drops | Client reconnects; receives current top-10 immediately |
