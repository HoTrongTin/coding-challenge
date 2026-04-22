# Problem 6 – Live Scoreboard Module

## Documents

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, component roles, key decisions, and flow diagrams. |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | API contracts, DB schema, Redis key design, implementation phases, and test cases. |
| [FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md) | Known improvements we are not building now, and the signal that tells us when to act. |

---

## Summary

A website has a scoreboard showing the **top 10 users by score** with **live updates**. Users complete in-app actions that increase their score. The system must:

- Accept score updates via API upon action completion.
- Protect against unauthorised or replayed score updates.
- Push leaderboard changes to all connected clients in real time.
- Scale horizontally across multiple server instances.

---

## Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-1 | Display the top 10 users by score on a public leaderboard. |
| FR-2 | The leaderboard must update live without a page refresh. |
| FR-3 | Completing an in-app action increases the user's score. |
| FR-4 | The client dispatches an API call upon action completion. |
| FR-5 | Only authorised, legitimate completions may increase a score. |
| FR-6 | Replayed or duplicated requests must be rejected. |

---

## Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Leaderboard reads return in under 50ms. Score update API returns in under 200ms at P95 under load. |
| **Scalability** | Runs across any number of API servers behind a load balancer. |
| **Availability** | 99.9% uptime. Redis runs as a cluster for high availability and automatic failover. PostgreSQL runs with a read replica; the hot leaderboard read path is served entirely by Redis and does not touch the DB. |
| **Concurrency** | Supports at least 1,000 concurrent score update requests with zero transaction failures. |
| **Real-time delivery** | Live leaderboard push delivered within 500ms to all connected clients, including under 10,000 concurrent WebSocket connections. |
| **Security** | Score changes require a valid JWT and a one-time action token. |
| **Consistency** | Leaderboard may lag up to 1 second — acceptable for this use case. |
| **Observability** | Every score update attempt is logged with its outcome and reason. |

---

## Key Technical Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Anti-replay** | JWT + single-use action token | JWT says who you are; the token proves you actually did the action. The server always decides how many points to add. |
| **Caching** | Write-through to Redis sorted ranking | The leaderboard in Redis is always up to date. No extra refresh step needed. Reads are served from memory. |
| **Real-time transport** | WebSocket | Keeps one open connection so the server can push updates immediately. The same connection can support two-way features later. |
| **Cross-instance broadcast** | Redis Pub/Sub | After a score update, all servers are notified so each one can push the new leaderboard to its own users. |
| **System of record** | PostgreSQL (DB-first writes) | Scores are saved to the DB first. If Redis goes down, scores are safe and will be rebuilt from the DB. |
| **Live update debounce** | 200ms debounce | A 200ms window groups rapid updates into a single leaderboard push. Every score change still takes effect — users just get one notification instead of many. |
