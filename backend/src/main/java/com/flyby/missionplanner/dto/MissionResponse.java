package com.flyby.missionplanner.dto;

import com.flyby.missionplanner.entity.MissionStatus;
import java.time.Instant;
import java.util.List;

//for details
public record MissionResponse(
        Long id,
        String name,
        String description,
        MissionStatus status,
        Long createdBy,
        Long assignedPilotId,
        Long droneId,
        Double defaultAltitudeM,
        Double speedMs,
        List<WaypointDto> waypoints,
        Double distanceM,
        Integer estimatedDurationS,
        Instant createdAt,
        Instant updatedAt,
        Long version
) {
}