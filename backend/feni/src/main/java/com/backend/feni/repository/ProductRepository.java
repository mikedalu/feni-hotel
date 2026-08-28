package com.backend.feni.repository;

import com.backend.feni.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    Optional<Product> findByInternalSku(String internalSku);
    Optional<Product> findByManufacturerBarcode(String manufacturerBarcode);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"inventoryStocks", "inventoryStocks.location", "taxBrackets"})
    java.util.List<Product> findAll();
}
