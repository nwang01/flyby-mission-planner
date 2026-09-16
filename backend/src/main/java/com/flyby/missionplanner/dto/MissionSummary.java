package com.flyby.missionplanner.dto;

import com.flyby.missionplanner.entity.MissionStatus;
import java.time.Instant;

//for list
public record MissionSummary(
        Long id,
        String name,
        MissionStatus status,
        Long assignedPilotId,
        Integer waypointCount,
        Instant updatedAt
) {
}