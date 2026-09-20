package com.flyby.missionplanner.dto;

import com.flyby.missionplanner.entity.DroneStatus;
import jakarta.validation.constraints.NotBlank;

public record DroneRequest(
        @NotBlank String name,
        @NotBlank String model,
        DroneStatus status
) {
}
