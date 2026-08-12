package com.backend.feni.entity;

import com.backend.feni.entity.enums.Role;
import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Entity
@Table(name = "staff_users")
@Data
public class StaffUser {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private boolean mustChangePassword = false;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private boolean active = true;
}