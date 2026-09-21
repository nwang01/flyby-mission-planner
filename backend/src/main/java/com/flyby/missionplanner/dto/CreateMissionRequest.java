package com.flyby.missionplanner.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record CreateMissionRequest(
        @NotBlank String name,
        String description,
        Long assignedPilotId,
        Double defaultAltitudeM,
        Double speedMs,
        List<WaypointDto> waypoints,
        Long droneId
        ) {
}

