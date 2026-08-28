package com.backend.feni.controller;

import com.backend.feni.dto.request.InventoryTransferRequest;
import com.backend.feni.service.InventoryTransferService;
import com.backend.feni.entity.StaffUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory/transfer")
@RequiredArgsConstructor
public class InventoryTransferController {

    private final InventoryTransferService transferService;
    private final com.backend.feni.repository.StaffUserRepository staffUserRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.OK)
    public void transferStock(@Valid @RequestBody InventoryTransferRequest request, @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getSubject();
        StaffUser staffUser = staffUserRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Staff user not found"));
        transferService.transferStock(request, staffUser.getId());
    }
}
