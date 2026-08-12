package com.backend.feni.repository;

import com.backend.feni.entity.JournalLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface JournalLineRepository extends JpaRepository<JournalLine, UUID> {
    
    @Query("SELECT jl FROM JournalLine jl WHERE jl.journalEntry.createdAt >= :start AND jl.journalEntry.createdAt < :end AND jl.accountName LIKE %:accountPrefix%")
    List<JournalLine> findByAccountNameStartingWithAndDateBetween(@Param("accountPrefix") String accountPrefix, @Param("start") Instant start, @Param("end") Instant end);
}
