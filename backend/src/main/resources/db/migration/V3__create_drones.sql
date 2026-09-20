CREATE TABLE drones (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    model          VARCHAR(255) NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'IDLE',
    flight_hours   DOUBLE PRECISION NOT NULL DEFAULT 0,
    missions_flown INT NOT NULL DEFAULT 0
);