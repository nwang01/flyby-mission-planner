package com.flyby.missionplanner.controller;

import com.flyby.missionplanner.dto.DroneRequest;
import com.flyby.missionplanner.dto.DroneResponse;
import com.flyby.missionplanner.service.DroneService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/drones")
public class DroneController {

    private final DroneService droneService;

    public DroneController(DroneService droneService) {
        this.droneService = droneService;
    }

    @GetMapping
    public List<DroneResponse> list() {
        return droneService.list();
    }

    @GetMapping("/{id}")
    public DroneResponse getById(@PathVariable Long id) {
        return droneService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public DroneResponse create(@Valid @RequestBody DroneRequest req) {
        return droneService.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public DroneResponse update(@PathVariable Long id, @Valid @RequestBody DroneRequest req) {
        return droneService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        droneService.delete(id);
    }
}
