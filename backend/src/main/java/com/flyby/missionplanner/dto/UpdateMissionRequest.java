package com.flyby.missionplanner.dto;

import com.flyby.missionplanner.entity.MissionStatus;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record UpdateMissionRequest(
        @NotBlank String name,
        String description,
        MissionStatus status,
        Long assignedPilotId,
        Double defaultAltitudeM,
        Double speedMs,
        List<WaypointDto> waypoints,
        Long droneId
        ) {
}