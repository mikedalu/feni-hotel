package com.backend.feni.repository;

import com.backend.feni.entity.InventoryLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface InventoryLocationRepository extends JpaRepository<InventoryLocation, UUID> {
}
