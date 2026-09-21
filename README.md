# Flyby Mission Planner

A full-stack drone mission planning prototype. Admins can plan flight routes on an
interactive map, assign them to pilots and drones, and manage a fleet. Pilots
can view the missions assigned to them.

## Tech Stack

**Backend**
- Java 21, Spring Boot 3.5
- Spring Data JPA (Hibernate) + PostgreSQL 16
- Spring Security with JWT authentication
- Flyway for versioned database migrations

**Frontend**
- React + TypeScript, built with Vite
- react-map-gl + Mapbox GL + deck.gl for the interactive map
- react-router for client-side routing

**Infrastructure**
- Docker + Docker Compose (one-command startup)
- Nginx serves the built frontend and proxies API calls

### Why this stack

- **Spring Boot + JPA + PostgreSQL** — a mature, well-documented backend
  ecosystem for standard CRUD-heavy applications with relational data
  (users, missions, waypoints, drones and their relationships).
- **Flyway** — versioned, reproducible schema so the database is created
  identically on any machine, with seed data, on first startup.
- **JWT (stateless auth)** — no server-side session state, which suits an API
  consumed by multiple clients (web now, mobile later).
- **React + TypeScript + Vite** — required map libraries (deck.gl, react-map-gl,
  mapbox-gl) are first-class in the React ecosystem; TypeScript adds
  compile-time safety; Vite gives fast dev feedback.
- **Docker Compose** — the whole system (database, backend, frontend) starts
  with a single command and runs identically in any Linux environment.

## Quick Start

Prerequisites: **Docker** (with Docker Compose) installed and running.

```bash
git clone https://github.com/nwang01/flyby-mission-planner.git
cd flyby-mission-planner
docker compose up --build
```

Then open **http://localhost:3000**

The database schema and seed users are created automatically on first startup
(via Flyway). No manual setup required.

### Test Accounts

| Role  | Email                 | Password    |
|-------|-----------------------|-------------|
| Admin | admin1@flyby.com      | admin1pass  |
| Admin | admin2@flyby.com      | admin2pass  |
| Pilot | pilot1@flyby.com      | pilot1pass  |
| Pilot | pilot2@flyby.com      | pilot2pass  |
| Pilot | pilot3@flyby.com      | pilot3pass  |

## Features

**Roles and access control**
- Two roles: **Admin** (full management) and **Pilot** (read-only on their own
  missions, plus marking them flown).
- Each user only sees their own data (admins see missions they created; pilots
  see missions assigned to them). Enforced both in the UI and on the backend.

**Mission planning**
- Interactive map to build a flight plan by clicking waypoints; connect them
  into a route; edit each waypoint (lat/lng/altitude/action) in a side panel.
- 3D map view (terrain + 3D buildings) with a 2D/3D toggle, plus a
  satellite/map style toggle.
- Per-mission default altitude and speed; flight distance (haversine) and
  estimated duration are computed automatically.

**Mission lifecycle**
- Status workflow: `DRAFT ⟷ READY → FLOWN`.
  - Admin moves DRAFT ⟷ READY (a pilot **and** a drone must be assigned before
    a mission can become READY).
  - Pilot marks their READY mission as FLOWN (one-way; FLOWN is terminal).
- Missions can only be edited while in DRAFT.

**Fleet management**
- CRUD for drones (name, model, status: AVAILABLE / MAINTENANCE).
- Missions can be assigned a drone. A drone under maintenance cannot fly.
- When a mission is marked FLOWN, the assigned drone's flight hours and
  missions-flown count are updated automatically.

**Data integrity and concurrency**
- Mission and drone names are globally unique (enforced by a database
  constraint, not an application-level check, so it holds under concurrency).
- Optimistic locking (JPA `@Version`) on mission status changes prevents
  conflicting concurrent updates (e.g. a pilot marking flown while an admin
  reverts to draft).

## API Overview

All endpoints are under `/api/v1`. Auth via `Authorization: Bearer <token>`.

| Method | Path                       | Description                        | Access        |
|--------|----------------------------|------------------------------------|---------------|
| POST   | `/auth/login`              | Log in, returns JWT                | Public        |
| GET    | `/me`                      | Current user                       | Authenticated |
| GET    | `/missions`               | List missions (own)                | Authenticated |
| GET    | `/missions/{id}`           | Mission detail (+ waypoints)       | Authenticated |
| POST   | `/missions`                | Create mission                     | Admin         |
| PUT    | `/missions/{id}`           | Update mission                     | Admin         |
| DELETE | `/missions/{id}`           | Delete mission                     | Admin         |
| PATCH  | `/missions/{id}/status`    | Change mission status              | Admin / Pilot |
| GET    | `/drones`                  | List drones                        | Authenticated |
| POST   | `/drones`                  | Create drone                       | Admin         |
| PUT    | `/drones/{id}`             | Update drone                       | Admin         |
| DELETE | `/drones/{id}`             | Delete drone                       | Admin         |
| GET    | `/users?role=PILOT`        | List pilots (for assignment)       | Admin         |

## Architecture

**Backend** follows a layered structure:
`Controller` (HTTP) → `Service` (business logic) → `Repository` (data access),
with **DTOs** at the API boundary so entities are never exposed directly.
Errors are handled centrally by a `@RestControllerAdvice` that maps exceptions
to appropriate HTTP status codes (404 / 403 / 401 / 400 / 409) with a
consistent JSON shape.

**Data model** (managed by Flyway migrations):
- `users` (email, password hash, role)
- `missions` (name, status, created_by, assigned_pilot_id, drone_id, default
  altitude, speed, version) with a one-to-many to `waypoints`
- `waypoints` (seq, lat, lng, altitude, action)
- `drones` (name, model, status, flight_hours, missions_flown)

**Frontend** is a React SPA: pages for login, mission list, mission detail,
map editor (create/edit), and fleet management, sharing a top navigation bar.
In development, Vite proxies `/api` to the backend; in production, Nginx does.

## Local Development (without Docker)

```bash
# Database
docker run --name flyby-postgres \
  -e POSTGRES_DB=missionplanner -e POSTGRES_USER=missionplanner \
  -e POSTGRES_PASSWORD=missionplanner -p 5432:5432 -d postgres:16-alpine

# Backend (from backend/)  — runs on :8080
./mvnw spring-boot:run

# Frontend (from frontend/) — runs on :5173, requires a Mapbox token
echo "VITE_MAPBOX_TOKEN=your_token_here" > .env
npm install && npm run dev
```

> The frontend needs a Mapbox access token (`VITE_MAPBOX_TOKEN`) for the map to
> render. In the Docker build the token is baked in at build time from the same
> env variable.

## Scope & Trade-offs

This is a prototype, so some things are intentionally simplified:

- **No flight simulation.** The task is about *planning* and *managing*
  missions, not executing flights. "Completion" is modeled as a status
  (FLOWN) marked by the pilot, which is enough to drive fleet statistics.
- **No scheduling.** A drone can be assigned to multiple missions over time;
  time-based scheduling / conflict detection is out of scope for a prototype.
- **Constant speed per mission.** Flight time is estimated as distance ÷ speed;
  the data model could be extended to per-waypoint speed if needed.
- **Single action per waypoint.** Real systems (e.g. DJI) support an action
  sequence per waypoint; simplified here to one action.
