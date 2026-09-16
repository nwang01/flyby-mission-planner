package com.flyby.missionplanner.repository;

import com.flyby.missionplanner.entity.Waypoint;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WaypointRepository extends JpaRepository<Waypoint, Long> {
}
