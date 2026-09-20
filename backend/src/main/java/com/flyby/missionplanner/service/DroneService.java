package com.flyby.missionplanner.service;

import com.flyby.missionplanner.dto.DroneRequest;
import com.flyby.missionplanner.dto.DroneResponse;
import com.flyby.missionplanner.entity.Drone;
import com.flyby.missionplanner.entity.DroneStatus;
import com.flyby.missionplanner.exception.NotFoundException;
import com.flyby.missionplanner.repository.DroneRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DroneService {

    private final DroneRepository droneRepository;

    public DroneService(DroneRepository droneRepository) {
        this.droneRepository = droneRepository;
    }

    public List<DroneResponse> list() {
        return droneRepository.findAll().stream().map(this::toResponse).toList();
    }

    public DroneResponse getById(Long id) {
        return toResponse(findDrone(id));
    }

    public DroneResponse create(DroneRequest req) {
        Drone drone = new Drone();
        drone.setName(req.name());
        drone.setModel(req.model());
        drone.setStatus(req.status() != null ? req.status() : DroneStatus.AVAILABLE);
        Drone saved = droneRepository.save(drone);
        return toResponse(saved);
    }

    public DroneResponse update(Long id, DroneRequest req) {
        Drone drone = findDrone(id);
        drone.setName(req.name());
        drone.setModel(req.model());
        if (req.status() != null) {
            drone.setStatus(req.status());
        }
        return toResponse(droneRepository.save(drone));
    }

    public void delete(Long id) {
        Drone drone = findDrone(id);
        droneRepository.delete(drone);
    }

    private Drone findDrone(Long id) {
        return droneRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Drone not found: " + id));
    }

    private DroneResponse toResponse(Drone d) {
        return new DroneResponse(
                d.getId(), d.getName(), d.getModel(), d.getStatus(),
                d.getFlightHours(), d.getMissionsFlown()
        );
    }
}
