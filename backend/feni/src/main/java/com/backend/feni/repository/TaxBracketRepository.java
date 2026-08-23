package com.backend.feni.repository;

import com.backend.feni.entity.TaxBracket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TaxBracketRepository extends JpaRepository<TaxBracket, UUID> {
}
