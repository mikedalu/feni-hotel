package com.backend.feni.entity;

import com.backend.feni.entity.enums.SystemAlertType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "system_alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemAlert {

    @Id
    @GeneratedValue
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SystemAlertType type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    @Builder.Default
    private boolean resolved = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean emailSent = false;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
}
