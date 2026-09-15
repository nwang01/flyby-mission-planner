-- V1__init.sql
-- users / missions / waypoints

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL,           -- ADMIN | PILOT
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE missions (
    id                 BIGSERIAL PRIMARY KEY,
    name               VARCHAR(255) NOT NULL,
    description        TEXT,
    status             VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',  -- DRAFT | READY | FLOWN
    created_by         BIGINT       NOT NULL REFERENCES users(id),
    assigned_pilot_id  BIGINT       REFERENCES users(id),
    default_altitude_m DOUBLE PRECISION,
    speed_ms           DOUBLE PRECISION,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE waypoints (
    id         BIGSERIAL PRIMARY KEY,
    mission_id BIGINT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    seq        INT    NOT NULL,
    lat        DOUBLE PRECISION NOT NULL,
    lng        DOUBLE PRECISION NOT NULL,
    alt_m      DOUBLE PRECISION,
    action     VARCHAR(50),
    CONSTRAINT uq_waypoint_mission_seq UNIQUE (mission_id, seq)
);

CREATE INDEX idx_missions_assigned_pilot ON missions(assigned_pilot_id);
CREATE INDEX idx_waypoints_mission ON waypoints(mission_id);