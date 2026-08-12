package com.backend.feni.controller;

import com.backend.feni.dto.request.AdminResetPasswordRequest;
import com.backend.feni.dto.request.CreateStaffUserRequest;
import com.backend.feni.dto.response.StaffUserResponse;
import com.backend.feni.entity.StaffUser;
import com.backend.feni.repository.StaffUserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/staff")
@RequiredArgsConstructor
public class AdminController {

    private final StaffUserRepository staffUserRepo;
    private final PasswordEncoder passwordEncoder;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StaffUserResponse createStaffUser(@Valid @RequestBody CreateStaffUserRequest req) {
        if (staffUserRepo.existsByUsername(req.getUsername())) {
            throw new IllegalArgumentException("Username already taken: " + req.getUsername());
        }

        StaffUser user = new StaffUser();
        user.setUsername(req.getUsername());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setRole(req.getRole());
        user.setActive(true);
        user.setMustChangePassword(true);

        StaffUser saved = staffUserRepo.save(user);

        return toResponse(saved);
    }

    @GetMapping
    public List<StaffUserResponse> listStaffUsers() {
        return staffUserRepo.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @PatchMapping("/{id}/deactivate")
    public StaffUserResponse deactivateStaffUser(@PathVariable UUID id) {
        StaffUser user = staffUserRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Staff user not found: " + id));

        user.setActive(false);
        StaffUser saved = staffUserRepo.save(user);
        return toResponse(saved);
    }

    @PostMapping("/{id}/reset-password")
    public StaffUserResponse resetStaffPassword(@PathVariable UUID id, @Valid @RequestBody AdminResetPasswordRequest req) {
        StaffUser user = staffUserRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Staff user not found: " + id));

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        user.setMustChangePassword(true);
        StaffUser saved = staffUserRepo.save(user);
        
        return toResponse(saved);
    }

    private StaffUserResponse toResponse(StaffUser user) {
        return new StaffUserResponse(user.getId(), user.getUsername(), user.getRole(), user.isActive());
    }
}