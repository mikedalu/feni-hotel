package com.backend.feni.config;

import com.backend.feni.entity.Facility;
import com.backend.feni.entity.StaffUser;
import com.backend.feni.entity.enums.Role;
import com.backend.feni.repository.FacilityRepository;
import com.backend.feni.repository.StaffUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.Base64;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final FacilityRepository facilityRepo;
    private final StaffUserRepository staffUserRepo;
    private final PasswordEncoder passwordEncoder;

    @Value("${bootstrap.facility.name}")
    private String facilityName;

    @Value("${bootstrap.facility.timezone}")
    private String facilityTimezone;

    @Value("${bootstrap.admin.username}")
    private String adminUsername;

    @Value("${bootstrap.admin.password:}")
    private String configuredAdminPassword;

    @Override
    public void run(String... args) {
        seedFacility();
        seedAdmin();
    }

    private void seedFacility() {
        if (facilityRepo.count() > 0) {
            return; // already seeded, never touch it again
        }

        Facility facility = new Facility();
        facility.setName(facilityName);
        facility.setTimezone(facilityTimezone);
        facilityRepo.save(facility);

        log.info("Seeded facility: {}", facilityName);
    }

    private void seedAdmin() {
        boolean adminExists = staffUserRepo.findAll().stream()
                .anyMatch(u -> u.getRole() == Role.ADMIN);

        if (adminExists) {
            return; // idempotent — never reseed on subsequent restarts
        }

        String initialPassword = configuredAdminPassword.isBlank()
                ? generateSecurePassword()
                : configuredAdminPassword;

        StaffUser admin = new StaffUser();
        admin.setUsername(adminUsername);
        admin.setPasswordHash(passwordEncoder.encode(initialPassword));
        admin.setRole(Role.ADMIN);
        admin.setActive(true);
        admin.setMustChangePassword(true); // forces reset on first login, regardless of source

        staffUserRepo.save(admin);

        log.warn("=================================================================");
        log.warn(" FIRST-BOOT ADMIN ACCOUNT CREATED");
        log.warn(" Username: {}", adminUsername);
        log.warn(" Password: {}", initialPassword);
        log.warn(" This password will NOT be shown again. Log in and change it now.");
        log.warn("=================================================================");
    }

    private String generateSecurePassword() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[18]; // 144 bits, comfortably strong
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}