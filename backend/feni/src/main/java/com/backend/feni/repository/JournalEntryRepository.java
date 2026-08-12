package com.backend.feni.repository;

import com.backend.feni.entity.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {
}
