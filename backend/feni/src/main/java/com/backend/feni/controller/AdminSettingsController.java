package com.backend.feni.controller;

import com.backend.feni.dto.request.AdminSettingsRequest;
import com.backend.feni.entity.Facility;
import com.backend.feni.entity.StaffUser;
import com.backend.feni.repository.FacilityRepository;
import com.backend.feni.repository.StaffUserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
public class AdminSettingsController {

    private final FacilityRepository facilityRepo;
    private final StaffUserRepository staffRepo;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public AdminSettingsRequest getSettings() {
        Facility facility = facilityRepo.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Facility not found"));
        
        AdminSettingsRequest response = new AdminSettingsRequest();
        response.setFacilityName(facility.getName());
        response.setTimezone(facility.getTimezone());
        response.setAddress(facility.getAddress());
        response.setAdminEmail(facility.getAdminEmail());
        return response;
    }

    @PutMapping
    public void updateSettings(@Valid @RequestBody AdminSettingsRequest request, @AuthenticationPrincipal Jwt jwt) {
        Facility facility = facilityRepo.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Facility not found"));
        
        boolean changed = false;
        
        if (request.getFacilityName() != null && !request.getFacilityName().isBlank()) {
            facility.setName(request.getFacilityName());
            changed = true;
        }
        if (request.getTimezone() != null && !request.getTimezone().isBlank()) {
            facility.setTimezone(request.getTimezone());
            changed = true;
        }
        if (request.getAddress() != null) {
            facility.setAddress(request.getAddress());
            changed = true;
        }
        if (request.getAdminEmail() != null) {
            facility.setAdminEmail(request.getAdminEmail());
            changed = true;
        }
        
        if (changed) {
            facilityRepo.save(facility);
        }
        
        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            UUID staffId = UUID.fromString(jwt.getClaimAsString("userId"));
            StaffUser user = staffRepo.findById(staffId)
                    .orElseThrow(() -> new IllegalArgumentException("Staff user not found"));
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
            staffRepo.save(user);
        }
    }
}
