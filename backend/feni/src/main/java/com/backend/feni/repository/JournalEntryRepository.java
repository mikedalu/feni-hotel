package com.backend.feni.repository;

import com.backend.feni.entity.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;
import java.time.Instant;

public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {
    List<JournalEntry> findByCreatedAtBetween(Instant start, Instant end);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT j FROM JournalEntry j JOIN j.lines l WHERE " +
            "(:accountName = '' OR LOWER(l.accountName) LIKE LOWER(CONCAT('%', :accountName, '%'))) AND " +
            "(j.createdAt BETWEEN :start AND :end) " +
            "ORDER BY j.createdAt DESC")
    List<JournalEntry> searchLedger(
            @org.springframework.data.repository.query.Param("accountName") String accountName,
            @org.springframework.data.repository.query.Param("start") Instant start,
            @org.springframework.data.repository.query.Param("end") Instant end
    );
}
