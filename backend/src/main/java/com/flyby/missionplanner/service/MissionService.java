package com.flyby.missionplanner.service;

import com.flyby.missionplanner.dto.*;
import com.flyby.missionplanner.entity.Mission;
import com.flyby.missionplanner.entity.MissionStatus;
import com.flyby.missionplanner.entity.Waypoint;
import com.flyby.missionplanner.repository.MissionRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import com.flyby.missionplanner.exception.NotFoundException;
import com.flyby.missionplanner.exception.AccessDeniedException;


@Service
@Transactional
public class MissionService {

    private final MissionRepository missionRepository;

    public MissionService(MissionRepository missionRepository) {
        this.missionRepository = missionRepository;
    }


    public List<MissionSummary> list(Long userId, boolean isAdmin) {
        List<Mission> missions = isAdmin
                ? missionRepository.findByCreatedBy(userId)
                : missionRepository.findByAssignedPilotId(userId);
        return missions.stream().map(this::toSummary).toList();
    }


    public MissionResponse getById(Long id, Long userId, boolean isAdmin) {
        Mission mission = missionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Mission not found: " + id));

        boolean canView = isAdmin
                ? userId.equals(mission.getCreatedBy())
                : userId.equals(mission.getAssignedPilotId());
        if (!canView) {
            throw new AccessDeniedException("Access denied");
        }
        return toResponse(mission);
    }

    //create, update, delete for admin only
    public MissionResponse create(CreateMissionRequest req, Long userId) {
        Mission mission = new Mission();
        mission.setName(req.name());
        mission.setDescription(req.description());
        mission.setStatus(MissionStatus.DRAFT);
        mission.setCreatedBy(userId);
        mission.setAssignedPilotId(req.assignedPilotId());
        mission.setDefaultAltitudeM(req.defaultAltitudeM());
        mission.setSpeedMs(req.speedMs());
        mission.setCreatedAt(Instant.now());
        mission.setUpdatedAt(Instant.now());
        applyWaypoints(mission, req.waypoints());

        Mission saved = missionRepository.save(mission);
        return toResponse(saved);
    }

    public MissionResponse update(Long id, UpdateMissionRequest req, Long userId) {
        Mission mission = missionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Mission not found: " + id));
        if (!userId.equals(mission.getCreatedBy())) {
            throw new AccessDeniedException("Access denied");
        }
        mission.setName(req.name());
        mission.setDescription(req.description());
        if (req.status() != null) {
            mission.setStatus(req.status());
        }
        mission.setAssignedPilotId(req.assignedPilotId());
        mission.setDefaultAltitudeM(req.defaultAltitudeM());
        mission.setSpeedMs(req.speedMs());
        mission.setUpdatedAt(Instant.now());

        mission.clearWaypoints();
        //refresh
        missionRepository.saveAndFlush(mission);
        applyWaypoints(mission, req.waypoints());

        Mission saved = missionRepository.save(mission);
        return toResponse(saved);
    }

    public void delete(Long id, Long userId) {
        Mission mission = missionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Mission not found: " + id));
        if (!userId.equals(mission.getCreatedBy())) {
            throw new AccessDeniedException("Access denied");
        }
        missionRepository.deleteById(id);
    }


    private void applyWaypoints(Mission mission, List<WaypointDto> waypointDtos) {
        if (waypointDtos == null) {
            return;
        }
        for (WaypointDto dto : waypointDtos) {
            Waypoint wp = new Waypoint();
            wp.setSeq(dto.seq());
            wp.setLat(dto.lat());
            wp.setLng(dto.lng());
            wp.setAltM(dto.altM());
            wp.setAction(dto.action());
            mission.addWaypoint(wp);
        }
    }

    private MissionSummary toSummary(Mission m) {
        return new MissionSummary(
                m.getId(),
                m.getName(),
                m.getStatus(),
                m.getAssignedPilotId(),
                m.getWaypoints().size(),
                m.getUpdatedAt()
        );
    }

    private MissionResponse toResponse(Mission m) {
        List<WaypointDto> waypoints = m.getWaypoints().stream()
                .map(wp -> new WaypointDto(wp.getSeq(), wp.getLat(), wp.getLng(), wp.getAltM(), wp.getAction()))
                .toList();

        double distanceM = calculateDistance(m.getWaypoints());
        Integer durationS = (m.getSpeedMs() != null && m.getSpeedMs() > 0)
                ? (int) Math.round(distanceM / m.getSpeedMs())
                : null;

        return new MissionResponse(
                m.getId(), m.getName(), m.getDescription(), m.getStatus(),
                m.getCreatedBy(), m.getAssignedPilotId(),
                m.getDefaultAltitudeM(), m.getSpeedMs(),
                waypoints, distanceM, durationS,
                m.getCreatedAt(), m.getUpdatedAt()
        );
    }

    private double calculateDistance(List<Waypoint> waypoints) {
        double total = 0;
        for (int i = 0; i < waypoints.size() - 1; i++) {
            total += haversine(
                    waypoints.get(i).getLat(), waypoints.get(i).getLng(),
                    waypoints.get(i + 1).getLat(), waypoints.get(i + 1).getLng());
        }
        return total;
    }

    private double haversine(double lat1, double lng1, double lat2, double lng2) {
        double R = 6371000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}