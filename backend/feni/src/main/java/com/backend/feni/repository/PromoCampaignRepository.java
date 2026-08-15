package com.backend.feni.repository;

import com.backend.feni.entity.PromoCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface PromoCampaignRepository extends JpaRepository<PromoCampaign, UUID> {

    @Query("SELECT p FROM PromoCampaign p WHERE p.isActive = true AND p.startDate <= :date AND p.endDate >= :date")
    List<PromoCampaign> findActiveCampaignsForDate(@Param("date") LocalDate date);
}
