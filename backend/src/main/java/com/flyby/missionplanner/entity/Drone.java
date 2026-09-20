package com.flyby.missionplanner.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;


@Entity
@Table(name = "drones")
public class Drone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String model;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DroneStatus status = DroneStatus.AVAILABLE;

    @Column(name = "flight_hours", nullable = false)
    private Double flightHours = 0.0;

    @Column(name = "missions_flown", nullable = false)
    private Integer missionsFlown = 0;

    public Drone() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public DroneStatus getStatus() { return status; }
    public void setStatus(DroneStatus status) { this.status = status; }
    public Double getFlightHours() { return flightHours; }
    public void setFlightHours(Double flightHours) { this.flightHours = flightHours; }
    public Integer getMissionsFlown() { return missionsFlown; }
    public void setMissionsFlown(Integer missionsFlown) { this.missionsFlown = missionsFlown; }
}