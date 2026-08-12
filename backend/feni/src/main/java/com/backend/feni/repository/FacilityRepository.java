package com.backend.feni.repository;

import com.backend.feni.entity.Facility;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacilityRepository extends JpaRepository<Facility, java.util.UUID> {}