package com.backend.feni.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.UUID;

@Entity
@Table(name = "smart_pos_terminals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SmartPosTerminal {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name; // e.g. "Moniepoint - Front Desk"

    private String serialNumber; // optional hardware SN

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
