package com.flyby.missionplanner.dto;

public record LoginResponse(
        String token,
        String role,
        Long userId
) {
}