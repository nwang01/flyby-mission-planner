ALTER TABLE missions
    ADD COLUMN drone_id BIGINT REFERENCES drones(id);