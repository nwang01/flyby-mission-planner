ALTER TABLE missions ADD CONSTRAINT uq_mission_name UNIQUE (name);
ALTER TABLE drones ADD CONSTRAINT uq_drone_name UNIQUE (name);