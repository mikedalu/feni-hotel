package com.backend.feni.repository;

import com.backend.feni.entity.InventoryStock;
import com.backend.feni.entity.InventoryLocation;
import com.backend.feni.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InventoryStockRepository extends JpaRepository<InventoryStock, UUID> {
    Optional<InventoryStock> findByProductAndLocation(Product product, InventoryLocation location);
}
