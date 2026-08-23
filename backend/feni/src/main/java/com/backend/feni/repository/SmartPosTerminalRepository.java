package com.backend.feni.repository;

import com.backend.feni.entity.SmartPosTerminal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SmartPosTerminalRepository extends JpaRepository<SmartPosTerminal, UUID> {
}
