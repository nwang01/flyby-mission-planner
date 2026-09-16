package com.flyby.missionplanner.repository;

import com.flyby.missionplanner.entity.Mission;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;


public interface MissionRepository extends JpaRepository<Mission, Long> {
    List<Mission> findByCreatedBy(Long createdBy);
    List<Mission> findByAssignedPilotId(Long assignedPilotId);
}