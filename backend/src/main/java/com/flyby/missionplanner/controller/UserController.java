package com.flyby.missionplanner.controller;

import com.flyby.missionplanner.entity.Role;
import com.flyby.missionplanner.service.UserService;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class UserController {

    private final UserService userService;
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        String role = authentication.getAuthorities().iterator().next().getAuthority();
        return Map.of("userId", userId, "role", role);
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String, Object>> listUsers(@RequestParam(required = false) Role role) {
        return userService.listByRole(role);
    }

    @GetMapping("/users/{id}")
    public Map<String, Object> getUser(@PathVariable Long id) {
        return userService.getById(id);
    }
}