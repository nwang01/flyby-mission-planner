package com.flyby.missionplanner.dto;

import com.flyby.missionplanner.entity.DroneStatus;

public record DroneResponse(
        Long id,
        String name,
        String model,
        DroneStatus status,
        Double flightHours,
        Integer missionsFlown
) {
}