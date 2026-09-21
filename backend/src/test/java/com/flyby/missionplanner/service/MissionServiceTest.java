package com.flyby.missionplanner.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.flyby.missionplanner.entity.Drone;
import com.flyby.missionplanner.entity.DroneStatus;
import com.flyby.missionplanner.entity.Mission;
import com.flyby.missionplanner.entity.MissionStatus;
import com.flyby.missionplanner.exception.AccessDeniedException;
import com.flyby.missionplanner.exception.BadRequestException;
import com.flyby.missionplanner.exception.NotFoundException;
import com.flyby.missionplanner.repository.DroneRepository;
import com.flyby.missionplanner.repository.MissionRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for MissionService business rules.
 * Repositories are mocked, so no database is needed.
 */
@ExtendWith(MockitoExtension.class)
class MissionServiceTest {

    private static final Long ADMIN_ID = 1L;
    private static final Long PILOT_ID = 3L;
    private static final Long OTHER_PILOT_ID = 4L;
    private static final Long DRONE_ID = 1L;
    private static final Long MISSION_ID = 10L;

    @Mock
    private MissionRepository missionRepository;

    @Mock
    private DroneRepository droneRepository;

    @InjectMocks
    private MissionService missionService;

    private Mission mission;

    @BeforeEach
    void setUp() {
        mission = new Mission();
        mission.setId(MISSION_ID);
        mission.setName("Test mission");
        mission.setStatus(MissionStatus.DRAFT);
        mission.setCreatedBy(ADMIN_ID);
        mission.setAssignedPilotId(PILOT_ID);
        mission.setDroneId(DRONE_ID);
        mission.setSpeedMs(5.0);
        mission.setCreatedAt(Instant.now());
        mission.setUpdatedAt(Instant.now());
        mission.setVersion(0L);
    }

    // ---------- ownership / access control ----------

    @Test
    void getById_deniesPilotAccessingSomeoneElsesMission() {
        when(missionRepository.findById(MISSION_ID)).thenReturn(Optional.of(mission));

        assertThatThrownBy(() -> missionService.getById(MISSION_ID, OTHER_PILOT_ID, false))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void getById_allowsAssignedPilot() {
        when(missionRepository.findById(MISSION_ID)).thenReturn(Optional.of(mission));

        assertThat(missionService.getById(MISSION_ID, PILOT_ID, false).id()).isEqualTo(MISSION_ID);
    }

    @Test
    void getById_throwsNotFoundForUnknownId() {
        when(missionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> missionService.getById(999L, ADMIN_ID, true))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void delete_deniesAdminWhoDidNotCreateTheMission() {
        when(missionRepository.findById(MISSION_ID)).thenReturn(Optional.of(mission));

        assertThatThrownBy(() -> missionService.delete(MISSION_ID, 2L)) // admin2, not the creator
                .isInstanceOf(AccessDeniedException.class);
        verify(missionRepository, never()).delete(any(Mission.class));
    }

    // ---------- status workflow ----------

    @Test
    void changeStatus_adminCanMoveDraftToReadyWhenPilotAndDroneAssigned() {
        when(missionRepository.findById(MISSION_ID)).thenReturn(Optional.of(mission));
        when(missionRepository.save(any(Mission.class))).thenAnswer(inv -> inv.getArgument(0));

        var result = missionService.changeStatus(MISSION_ID, MissionStatus.READY, 0L, ADMIN_ID, true);

        assertThat(result.status()).isEqualTo(MissionStatus.READY);
    }

    @Test
    void changeStatus_rejectsReadyWhenNoPilotAssigned() {
        mission.setAssignedPilotId(null);
        when(missionRepository.findById(MISSION_ID)).thenReturn(Optional.of(mission));

        assertThatThrownBy(() -> missionService.changeStatus(MISSION_ID, MissionStatus.READY, 0L, ADMIN_ID, true))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void changeStatus_rejectsReadyWhenNoDroneAssigned() {
        mission.setDroneId(null);
        when(missionRepository.findById(MISSION_ID)).thenReturn(Optional.of(mission));

        assertThatThrownBy(() -> missionService.changeStatus(MISSION_ID, MissionStatus.READY, 0L, ADMIN_ID, true))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void changeStatus_pilotCannotMoveDraftToReady() {
        when(missionRepository.findById(MISSION_ID)).thenReturn(Optional.of(mission));

        assertThatThrownBy(() -> missionService.changeStatus(MISSION_ID, MissionStatus.READY, 0L, PILOT_ID, false))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void changeStatus_assignedPilotCanMarkReadyMissionAsFlown() {
        mission.setStatus(MissionStatus.READY);
        Drone drone = availableDrone();
        when(missionRepository.findById(MISSION_ID)).thenReturn(Optional.of(mission));
        when(droneRepository.findById(DRONE_ID)).thenReturn(Optional.of(drone));
        when(missionRepository.save(any(Mission.class))).thenAnswer(inv -> inv.getArgument(0));

        var result = missionService.changeStatus(MISSION_ID, MissionStatus.FLOWN, 1L, PILOT_ID, false);

        assertThat(result.status()).isEqualTo(MissionStatus.FLOWN);
    }

    @Test
    void changeStatus_otherPilotCannotMarkMissionAsFlown() {
        mission.setStatus(MissionStatus.READY);
        when(missionRepository.findById(MISSION_ID)).thenReturn(Optional.of(mission));

        assertThatThrownBy(() -> missionService.changeStatus(MISSION_ID, MissionStatus.FLOWN, 1L, OTHER_PILOT_ID, false))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void changeStatus_flownIsTerminal_cannotRevertToDraft() {
        mission.setStatus(MissionStatus.FLOWN);
        when(missionRepository.findById(MISSION_ID)).thenReturn(Optional.of(mission));

        assertThatThrownBy(() -> missionService.changeStatus(MISSION_ID, MissionStatus.DRAFT, 2L, ADMIN_ID, true))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void changeStatus_rejectsFlownWhenDroneUnderMaintenance() {
        mission.setStatus(MissionStatus.READY);
        Drone drone = availableDrone();
        drone.setStatus(DroneStatus.MAINTENANCE);
        when(missionRepository.findById(MISSION_ID)).thenReturn(Optional.of(mission));
        when(droneRepository.findById(DRONE_ID)).thenReturn(Optional.of(drone));

        assertThatThrownBy(() -> missionService.changeStatus(MISSION_ID, MissionStatus.FLOWN, 1L, PILOT_ID, false))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void changeStatus_markingFlownAccumulatesDroneStats() {
        mission.setStatus(MissionStatus.READY);
        Drone drone = availableDrone();
        drone.setMissionsFlown(2);
        drone.setFlightHours(1.0);
        when(missionRepository.findById(MISSION_ID)).thenReturn(Optional.of(mission));
        when(droneRepository.findById(DRONE_ID)).thenReturn(Optional.of(drone));
        when(missionRepository.save(any(Mission.class))).thenAnswer(inv -> inv.getArgument(0));

        missionService.changeStatus(MISSION_ID, MissionStatus.FLOWN, 1L, PILOT_ID, false);

        assertThat(drone.getMissionsFlown()).isEqualTo(3);
        verify(droneRepository).save(drone);
    }

    // ---------- helpers ----------

    private Drone availableDrone() {
        Drone drone = new Drone();
        drone.setId(DRONE_ID);
        drone.setName("Falcon-1");
        drone.setModel("DJI Matrice 350");
        drone.setStatus(DroneStatus.AVAILABLE);
        drone.setFlightHours(0.0);
        drone.setMissionsFlown(0);
        return drone;
    }
}
