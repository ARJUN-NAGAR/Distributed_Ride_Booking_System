# 🚗 Distributed Ride-Matching System

<p align="center">
  <img src="https://img.shields.io/badge/Java-25-orange?style=for-the-badge&logo=openjdk" />
  <img src="https://img.shields.io/badge/Spring_Boot-3.2.5-brightgreen?style=for-the-badge&logo=springboot" />
  <img src="https://img.shields.io/badge/Apache_Kafka-Event_Streaming-231F20?style=for-the-badge&logo=apachekafka" />
  <img src="https://img.shields.io/badge/Redis-GEO_%26_PubSub-DC382D?style=for-the-badge&logo=redis" />
  <img src="https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker" />
</p>

An enterprise-grade, **event-driven microservices architecture** simulating a high-scale ride-hailing backend — architecturally equivalent to how companies like **Uber and Lyft** are built at their core.

This is not a CRUD application. It is a distributed system that tackles the four core infrastructure problems that break every monolithic ride-sharing backend under real-world load.

---

## 📋 Table of Contents

- [The Problem: Why Monoliths Break](#-the-problem-why-monoliths-break)
- [System Architecture](#️-system-architecture)
- [How Each Problem is Solved](#-how-each-problem-is-solved)
- [Algorithms & Heuristics](#-algorithms--heuristics)
- [Module Structure](#-module-structure)
- [Technology Matrix](#-technology-matrix)
- [Comparison vs. Uber's Real Architecture](#-comparison-vs-ubers-real-architecture)
- [Local Development Setup](#️-local-development-setup)
- [End-to-End Simulation Guide](#-end-to-end-simulation-guide)
- [Load Testing & DDoS Simulation](#-load-testing--ddos-simulation)
- [API Reference](#-api-reference)

---

## 🔥 The Problem: Why Monoliths Break

If a standard CRUD engineer builds a ride-sharing backend with a single Spring Boot app and MySQL, it works for 10 users. At 100,000 concurrent users, it collapses due to **four catastrophic bottlenecks**:

| # | Bottleneck | Impact |
|---|---|---|
| 1 | **Telemetry Avalanche** | 100,000 drivers × GPS update every 3s = **33,000 DB writes/sec**. MySQL hits WAL bloat and disk I/O exhaustion. |
| 2 | **Geospatial Search** | Finding drivers within 5km using SQL `WHERE` + Haversine on all rows is **O(N)** — takes seconds, not milliseconds. |
| 3 | **Dual-Write Data Loss** | Save ride to DB ✅ → Kafka crashes → dispatch never notified → **rider stranded forever**. |
| 4 | **Polling DDoS** | 50,000 riders calling `GET /ride/status` every second = **50,000 req/sec self-inflicted attack** on own gateway. |

**This project engineers around all four of these problems using distributed systems patterns.**

---

## 🏗️ System Architecture

![Distributed Ride-Matching System Architecture](docs/architecture.jpg)


### Architectural Patterns Applied

| Pattern | Where Used | Purpose |
|---|---|---|
| **Choreographed Saga** | Kafka Topics | Coordinates distributed transactions across ride & matching services without 2PC |
| **Transactional Outbox** | MySQL `outbox_events` table | Guarantees zero message loss between DB write and Kafka publish |
| **Redis Pub/Sub Backplane** | SSE notification layer | Enables horizontally scaled `ride-service` instances to route updates to the correct user |
| **Lazy Eviction TTL** | Redis driver keys | Automatically removes offline/ghost drivers from the dispatch pool |
| **Circuit Breaker** | `matching-service` → `location-service` | Falls back to cached historical data if location service is unreachable |
| **Shared Kernel** | `common` module | Compile-time contract safety for shared DTOs and event schemas |

---

## 🔧 How Each Problem is Solved

### 1. Telemetry Avalanche → Redis GEO

The `location-service` **never touches MySQL**. Every GPS ping is written directly to an in-memory Redis GEO sorted set using `GEOADD`. Redis runs entirely in RAM at C-speed, absorbing tens of thousands of writes per second without any disk I/O.

A strict **15-second TTL** is applied to every driver key. If a driver loses cell service or exits the app, Redis automatically prunes their phantom location — the dispatch engine only ever sees fresh, active drivers.

### 2. Geospatial Search → Geohash Indexing

When the `matching-service` needs candidates, it issues a single `GEOSEARCH` command. Redis uses **Geohashes (Z-order space-filling curves)** internally, reducing an `O(N)` full-table scan to an `O(N + log(M))` in-memory radius lookup returning results in **sub-milliseconds**.

### 3. Dual-Write Data Loss → Transactional Outbox Pattern

When a rider books a trip, `ride-service` saves **both** the `Ride` record **and** an `OutboxEvent` payload in the exact same ACID MySQL transaction. If either fails, both roll back atomically.

A background `OutboxProcessor` polls the outbox table and safely publishes to Kafka. If the matching service is offline, messages queue safely in Kafka. When it restarts, it consumes the backlog. No data is ever lost.

**Saga Compensating Transaction:** If no drivers are found, `matching-service` publishes a `ride.matching-failed` event. `ride-service` consumes this and automatically cancels the ride so the user isn't charged.

### 4. The Polling DDoS → SSE + Redis Pub/Sub Backplane

Instead of riders polling, the server **pushes** updates using **Server-Sent Events (SSE)** — a lightweight HTTP tunnel requiring only one persistent connection per rider.

**The distributed challenge:** With multiple `ride-service` instances behind a load balancer, Instance A holds the user's SSE socket but Instance B may process the Kafka match event.

**The backplane solution:** Instance B publishes the update to a Redis Pub/Sub channel. Every instance is subscribed. Instance A hears the broadcast, checks its local `ConcurrentHashMap` of active connections, finds the user's socket, and pushes the update. Infinitely horizontally scalable.

---

## 📐 Algorithms & Heuristics

### Dynamic Fare Calculation

$$\text{Fare} = \left( \text{Base Fare} + (\text{Distance (km)} \times \text{Rate per km}) \right) \times \text{Surge Multiplier}$$

### Spatial Distance — Haversine Formula

Used to calculate precise geodesic distance between two coordinates on Earth's surface:

$$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta\text{lon}}{2}\right)}\right)$$

*Where $R = 6371.0\text{ km}$ (Earth radius)*

### Driver Dispatch Scoring Heuristic

The system doesn't just pick the nearest driver. It uses a **weighted scoring function** that balances proximity with driver quality:

$$\text{Score} = (\text{Distance (km)} \times 0.7) + ((5.0 - \text{Rating}) \times 0.3)$$

> The dispatcher selects the candidate with the **lowest** score — closest and highest rated.

### Computational Complexity Summary

| Operation | Algorithm | Complexity |
|---|---|---|
| Driver location write | Redis `GEOADD` | O(log M) |
| Nearby driver search | Redis `GEOSEARCH` | O(N + log M) |
| Exact distance calc | Haversine | O(N) on N candidates |
| Ride DB lookup | B-Tree index | O(log R) |
| SSE connection routing | `ConcurrentHashMap` | O(1) |
| Redis Pub/Sub broadcast | Redis channels | O(S) — S = subscribers |

---

## 📦 Module Structure

```
distributed-ride-matching/
├── api-gateway/         # Spring Cloud Gateway — rate limiting, routing, JWT validation
├── common/              # Shared Kernel — DTOs, Kafka event contracts, rate limiting interceptor
├── location-service/    # Telemetry ingestion — writes GPS to Redis GEO, lazy eviction
├── ride-service/        # State machine — ride lifecycle, MySQL persistence, SSE push
├── matching-service/    # Dispatch engine — Kafka consumer, Feign client, scoring heuristic
├── frontend/            # React (Vite + Zustand + Leaflet) — Rider, Driver, Ops dashboards
├── scripts/             # Load test scripts — 10K rider simulation, DDoS defense scripts
├── docs/                # Architecture deep-dives, interview masterclass, retrospectives
└── docker-compose.yml   # Kafka (KRaft mode) + Redis — complete local infrastructure
```

---

## 🛠️ Technology Matrix

| Technology | Layer | Purpose |
|---|---|---|
| **Java 25** | Language | Backend microservice development |
| **Spring Boot 3.2.5** | Framework | REST APIs, DI, autoconfiguration |
| **Spring Cloud Gateway** | Perimeter | Routing, global rate limiting |
| **Spring Cloud OpenFeign** | Service Mesh | Declarative HTTP client for inter-service calls |
| **Resilience4j** | Fault Tolerance | Circuit breakers protecting matching → location calls |
| **Apache Kafka (KRaft)** | Message Broker | Asynchronous Saga coordination backbone |
| **Redis 7.2** | In-Memory Store | Driver GEO index, rate limit state, SSE Pub/Sub backplane |
| **MySQL 8.0** | Database | ACID-compliant ride records and transactional outbox |
| **Flyway** | DB Migrations | Version-controlled, auto-applied schema management |
| **React + Vite + Zustand** | Frontend | Rider/Driver/Ops simulation dashboards |
| **Leaflet.js + useRef + LERP** | Map Rendering | 60 FPS smooth driver marker animation without React re-renders |
| **Lombok** | Boilerplate Reduction | Auto-generated builders, getters, and setters |
| **Docker + Docker Compose** | Infrastructure | Containerized local development environment |

---

## ⚖️ Comparison vs. Uber's Real Architecture

| Component | Uber (Production) | This System |
|---|---|---|
| **Driver Tracking** | H3 Hexagonal Index (Go) — O(1) hex lookup | Redis GEO Geohash — O(N + log M) radius search |
| **Event Pipeline** | Kafka + Debezium CDC (WAL tailer) | Kafka + Transactional Outbox (scheduled poller) |
| **Real-time Push** | WebSockets via RAMP platform (custom Go) | SSE + Redis Pub/Sub backplane (Spring) |
| **Database** | Docstore / Schemaless on Cassandra/MySQL | MySQL 8.0 with explicit B-Tree indexes |
| **Rate Limiting** | Composite key (User ID + Device fingerprint + JA3 TLS hash) | IP-based Redis counter with token bucket |
| **Service Discovery** | Consul / Kubernetes DNS | Spring Cloud OpenFeign with hardcoded service IDs |

> Both systems converge on the same core principles: **Eventual Consistency**, **Decoupled Storage**, and **Distributed Real-Time Routing**. The difference is operational scale.

---

## 🛠️ Local Development Setup

### Prerequisites

- **Docker Desktop** (running)
- **Java 17+** (or 25 as used in the project)
- **Maven 3.9+**
- **Node.js 18+**

### Step 1: Start Infrastructure (Kafka + Redis)

```bash
# From the project root — starts Kafka (KRaft mode, no Zookeeper) and Redis
docker-compose up -d
```

This starts:
- **Redis** on port `16379`
- **Apache Kafka** (KRaft) on port `9092`

### Step 2: Start MySQL (Docker)

```bash
# Spin up a fresh MySQL 8.0 instance
docker run --name distributed-ride-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=defaultdb \
  -p 3306:3306 -d mysql:8.0

# Wait ~15 seconds for MySQL to initialize, then create the application user
docker exec distributed-ride-mysql mysql -uroot -proot -e \
  "CREATE USER 'avnadmin'@'%' IDENTIFIED WITH mysql_native_password BY 'password'; \
   GRANT ALL PRIVILEGES ON *.* TO 'avnadmin'@'%'; FLUSH PRIVILEGES;"
```

### Step 3: Configure Environment

Ensure the `.env` file in the project root contains:
```env
DB_PASSWORD=password
```

> The project uses `spring-dotenv` to automatically load this file on startup. It overrides the default value in `application.properties`.

### Step 4: Boot Backend Services

Open the project in IntelliJ IDEA and start in this order:
1. `ApiGatewayApplication` — Port **8080**
2. `LocationServiceApplication` — Port **8082**
3. `MatchingServiceApplication` — Port **8084**
4. `RideServiceApplication` — Port **8083** *(Flyway will auto-migrate the database schema on first boot)*

### Step 5: Start Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

---

## 🎬 End-to-End Simulation Guide

### 1. Seed a Driver (Apidog / Postman)

```http
POST http://localhost:8082/api/location/telemetry
Content-Type: application/json

{
  "driverId": "driver_101",
  "latitude": 28.6139,
  "longitude": 77.2090
}
```

Send this **3–4 times** to ensure the driver's TTL is refreshed in Redis.

### 2. Book a Ride (React Frontend)

1. Open `http://localhost:3000`
2. Select a pickup near `28.6139, 77.2090` and a drop location
3. Click **"Book Ride"**

**What happens in the background:**
```
Frontend → ride-service → MySQL (saves Ride + OutboxEvent in 1 ACID tx)
                       → ride-service returns status: MATCHING
                       → SSE connection established
OutboxProcessor → Kafka (publishes ride.requested)
Kafka → matching-service → location-service (GEORADIUS: finds driver_101)
                         → Scoring heuristic selects best driver
                         → Kafka (publishes ride.matched)
Kafka → ride-service → MySQL (status: ACCEPTED)
                     → Redis Pub/Sub (broadcasts update)
                     → SSE push → Frontend shows "Driver Assigned!"
```

### 3. Progress the Ride (Apidog)

```http
# Start the ride (driver arrived at pickup)
POST http://localhost:8083/api/rides/{RIDE_ID}/start

# Complete the ride (reached destination)
POST http://localhost:8083/api/rides/{RIDE_ID}/complete
```

Each call triggers a Kafka event → SSE push → live UI update.

---

## 🔫 Load Testing & DDoS Simulation

Load test scripts are in the `scripts/` directory:

```bash
# Simulate 10,000 concurrent valid riders
node scripts/simulate_10k_valid_riders.js

# Simulate DDoS attack and observe rate-limiter defense
node scripts/simulate_ddos_defense.js
```

### Rate Limiting Architecture

The `api-gateway` enforces IP-based Redis counters. During a DDoS test, **~97% of requests are dropped with HTTP 429** before ever touching a microservice. The 3% that pass are legitimate requests within the rate limit window.

**Production upgrade path:** Replace IP-based keys with composite keys `rate:limit:user:{userId}` to avoid blocking legitimate users on shared IPs (CGNAT).

---

## 📡 API Reference

| Service | Method | Endpoint | Description |
|---|---|---|---|
| **Location** | `POST` | `/api/location/telemetry` | Ingest driver GPS coordinates into Redis GEO |
| **Location** | `GET` | `/api/location/nearby?lat=&lon=&radius=` | Query nearby active drivers |
| **Ride** | `POST` | `/api/rides/book` | Create a new ride request |
| **Ride** | `POST` | `/api/rides/{id}/start` | Driver starts the trip |
| **Ride** | `POST` | `/api/rides/{id}/complete` | Driver completes the trip |
| **Ride** | `POST` | `/api/rides/{id}/cancel` | Cancel a ride |
| **Ride** | `GET` | `/api/rides/stream/{id}` | Open SSE stream for live ride status updates |
| **All** | `GET` | `/actuator/health` | Service health check |

