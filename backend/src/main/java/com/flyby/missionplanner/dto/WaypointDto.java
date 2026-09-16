package com.flyby.missionplanner.dto;

public record WaypointDto(
        Integer seq,
        Double lat,
        Double lng,
        Double altM,
        String action
) {
}