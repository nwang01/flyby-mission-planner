package com.flyby.missionplanner.controller;

import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class UserController {

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        String role = authentication.getAuthorities().iterator().next().getAuthority();
        return Map.of(
                "userId", userId,
                "role", role
        );
    }
}