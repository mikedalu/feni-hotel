package com.backend.feni.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "facility")
@Data
public class Facility {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String timezone;
    private String address;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}