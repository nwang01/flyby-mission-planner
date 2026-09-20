package com.flyby.missionplanner.repository;

import com.flyby.missionplanner.entity.Drone;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DroneRepository extends JpaRepository<Drone, Long> {
}
