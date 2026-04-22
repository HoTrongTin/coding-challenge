# Future Improvements – Live Scoreboard Module

> Known improvements categorized into short-term (next iteration) and long-term (scale & evolution).

---

## Table of Contents

1. [Short-Term Improvements (Next Iteration)](#1-short-term-improvements-next-iteration)
   - [1.1 Relative User Ranking](#11-relative-user-ranking)
   - [1.2 Leaderboard Pagination](#12-leaderboard-pagination)
   - [1.3 Admin Score Override Audit](#13-admin-score-override-audit)
   - [1.4 Observability Pipeline (Prometheus/Grafana)](#14-observability-pipeline-prometheusgrafana)
2. [Long-Term Improvements (Scale & Evolution)](#2-long-term-improvements-scale--evolution)
   - [2.1 Time-Based Leaderboards](#21-time-based-leaderboards)
   - [2.2 Multi-Game & Multi-Room Support](#22-multi-game--multi-room-support)
   - [2.3 Inactive Player Push Notifications](#23-inactive-player-push-notifications)
   - [2.4 Dedicated MQTT Broker for Massive Scale](#24-dedicated-mqtt-broker-for-massive-scale)
   - [2.5 Async Fraud Detection](#25-async-fraud-detection)

---

## 1. Short-Term Improvements (Next Iteration)

These are high-value additions that improve user experience and operational readiness before scaling up.

### 1.1 Relative User Ranking

If a user is ranked #500, seeing only the top 10 is demotivating. To contextualize their progress and drive continuous engagement, we should modify the leaderboard payload to return the top 9 users, appending the requesting user's specific rank and score as the 10th item if they aren't already included.

**Implementation:**
- Execute `ZREVRANGE` for the top 9.
- Check if the requesting user is in that top 9.
- If the user is absent, use `ZREVRANK` and `ZSCORE` to fetch and append their specific data to the response payload.

**Example Payload:**
```json
{
  "top": [
    { "userId": "user_1", "score": 10000, "rank": 1 }
    /* ... users 2 through 9 */
  ],
  "currentUser": { "userId": "user_123", "score": 450, "rank": 500 }
}
```

### 1.2 Leaderboard Pagination

As the user base grows, clients will naturally want to scroll beyond the top 10 to view the top 50 or 100 users. Returning large datasets in a single request consumes unnecessary bandwidth and slows down response times, so we need to support paginated reads.

**Implementation:**
- Add `offset` and `limit` query parameters to the existing `GET` leaderboard API endpoint.
- Use the Redis `ZREVRANGE` command, passing the calculated start and stop indexes based on the requested pagination parameters.
- Include a total count (using `ZCARD`) in the response metadata so the frontend can accurately render scrolling or page controls.

**Example API Request:**
```http
GET /scores/top?limit=20&offset=40

Response:
{
  "data": [ /* 20 users */ ],
  "meta": {
    "total": 15420,
    "limit": 20,
    "offset": 40
  }
}
```

### 1.3 Admin Score Override Audit

Customer support will eventually need to manually adjust scores. Direct database edits are dangerous and bypass the system's auditability, so we need a secure way to track manual changes.

**Implementation:**
- Create a dedicated internal Admin API endpoint for manual score adjustments.
- Require the endpoint to insert a specific `ADMIN_OVERRIDE` event into the `score_events` table.
- Use this event log as the immutable audit trail for all manual interventions.

**Example Endpoint:**
```http
POST /admin/users/:userId/adjust-score
Authorization: Bearer <ADMIN_TOKEN>

{
  "delta": -1000,
  "reason": "Exploit abuse",
  "auditTrail": "ticket-12345"
}
```

### 1.4 Observability Pipeline (Prometheus/Grafana)

Without metrics and structured logs, debugging production incidents or verifying that the system meets its latency NFRs is nearly impossible. We must standardize JSON structured logs across the API and expose a `/metrics` endpoint for Prometheus scraping.

**Implementation:**
- Emit JSON structured logs containing `traceId`, `userId`, `outcome`, and `durationMs` for every score update.
- Track `score_update_duration_ms` (Histogram) and `ws_connections_active` (Gauge) via the metrics endpoint.
- Build Grafana dashboards on top of Prometheus to visualize these metrics for alerting and health monitoring.

**Example Structured Log:**
```json
{
  "timestamp": "2023-10-27T10:00:00Z",
  "level": "info",
  "event": "score_update",
  "traceId": "abc-123-xyz",
  "userId": "user_42",
  "durationMs": 14,
  "outcome": "success"
}
```

---

## 2. Long-Term Improvements (Scale & Evolution)

Architectural shifts required to support new business features or massive scale.

### 2.1 Time-Based Leaderboards

A single all-time leaderboard eventually stagnates, making it impossible for new users to compete. To give new players a fair chance to win on shorter time horizons, we should introduce separate leaderboards for different timeframes (e.g., Daily, Weekly, All-Time).

**Implementation:**
- Maintain multiple Redis Sorted Set keys (e.g., `scoreboard:ranking:daily:20231027`).
- Increment the score across all active time buckets when a score update arrives.
- Set a Time-To-Live (TTL) on the temporary keys so Redis automatically cleans up old data without requiring background sweeping jobs.

**Example Redis Commands:**
```redis
ZINCRBY scoreboard:ranking:all_time 10 "user_1"
ZINCRBY scoreboard:ranking:daily:20231027 10 "user_1"
EXPIRE scoreboard:ranking:daily:20231027 86400
```

### 2.2 Multi-Game & Multi-Room Support

As the business expands, we will likely need to support multiple distinct games or partition players into smaller, more competitive "rooms". 

**Implementation:**
- Namespace all Redis keys and database tables with a `gameId` or `roomId` (e.g., `scoreboard:{gameId}:{roomId}:ranking`).
- Update WebSocket clients to subscribe to specific topic channels instead of receiving a global broadcast.

**Example Channel Subscription:**
```javascript
// Client subscribes to a specific room's leaderboard
ws.subscribe('/ws/v1/scoreboard?gameId=chess&roomId=expert_lobby')
```

### 2.3 Inactive Player Push Notifications

When users are offline, their rank naturally decays as active players score points. To drive re-engagement, we should proactively notify players when their rank drops dramatically (e.g., falling out of the Top 10 or Top 100), prompting them to return and defend their position.

**Implementation:**
- Create a background worker that takes periodic snapshots of the leaderboard.
- Compare user ranks between snapshots to detect significant drops (e.g., `current_rank - previous_rank > 50` or crossing a major tier boundary).
- Integrate with a Push Notification service (like FCM or APNs) to send alerts to affected inactive users.

**Example Push Payload:**
```json
{
  "title": "Your rank is dropping! 📉",
  "body": "You just fell to rank #12. Jump back in to defend your Top 10 spot!",
  "data": {
    "action": "open_leaderboard",
    "previousRank": 8,
    "currentRank": 12
  }
}
```

### 2.4 Dedicated MQTT Broker for Massive Scale

Managing thousands of idle WebSocket connections consumes significant memory and CPU on the API servers, which limits their capacity to process incoming score updates. By migrating to a dedicated MQTT broker, we offload this connection management entirely. Furthermore, modern MQTT brokers can be clustered and distributed, drastically improving system resilience. The MQTT protocol is also significantly lighter than WebSockets, reducing bandwidth overhead and improving performance for clients, particularly on mobile or unreliable networks.

**Implementation:**
- Replace API-hosted WebSockets with a distributed MQTT broker cluster (like EMQX or HiveMQ).
- Update the API servers to publish "Top 10 updated" messages directly to the MQTT broker.
- Have the MQTT broker handle the massive fan-out of push notifications to all connected clients.

### 2.5 Async Fraud Detection

Synchronous rate-limiting catches basic spam, but complex anti-cheat heuristics—such as checking IP geolocation or impossible action times—would severely slow down the legitimate API path.

**Implementation:**
- Stream all score events to a Kafka topic immediately after writing to Redis/DB.
- Deploy a background worker to consume this topic and run complex rule engines to analyze player patterns.
- If cheating is detected, automatically issue rollback transactions to the DB and ban the user.
