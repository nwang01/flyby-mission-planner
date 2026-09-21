package com.flyby.missionplanner.controller;

import com.flyby.missionplanner.dto.*;
import com.flyby.missionplanner.service.MissionService;
import jakarta.validation.Valid;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/missions")
public class MissionController {

    private final MissionService missionService;

    public MissionController(MissionService missionService) {
        this.missionService = missionService;
    }


    private Long currentUserId(Authentication auth) {
        return (Long) auth.getPrincipal();
    }

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @GetMapping
    public List<MissionSummary> list(Authentication auth) {
        return missionService.list(currentUserId(auth), isAdmin(auth));
    }

    @GetMapping("/{id}")
    public MissionResponse getById(@PathVariable Long id, Authentication auth) {
        return missionService.getById(id, currentUserId(auth), isAdmin(auth));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public MissionResponse create(@Valid @RequestBody CreateMissionRequest req,
                                  Authentication auth) {
        return missionService.create(req, currentUserId(auth));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public MissionResponse update(@PathVariable Long id,
                                  @Valid @RequestBody UpdateMissionRequest req,
                                  Authentication auth) {
        return missionService.update(id, req, currentUserId(auth));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id, Authentication auth) {
        missionService.delete(id, currentUserId(auth));
    }

    @PatchMapping("/{id}/status")
    public MissionResponse changeStatus(@PathVariable Long id,
                                        @RequestBody StatusRequest req,
                                        Authentication auth) {
        return missionService.changeStatus(id, req.status(), req.version(), currentUserId(auth), isAdmin(auth));
    }
}