package com.backend.feni.repository;

import com.backend.feni.entity.SystemAlert;
import com.backend.feni.entity.enums.SystemAlertType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SystemAlertRepository extends JpaRepository<SystemAlert, UUID> {
    List<SystemAlert> findByResolvedFalse();
    List<SystemAlert> findByEmailSentFalse();
    Optional<SystemAlert> findFirstByTypeAndResolvedFalse(SystemAlertType type);
}
