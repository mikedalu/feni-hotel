package com.backend.feni.controller;

import com.backend.feni.dto.request.InventoryIntakeRequest;
import com.backend.feni.service.InventoryIntakeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryIntakeService inventoryIntakeService;

    @PostMapping("/intake")
    @ResponseStatus(HttpStatus.CREATED)
    public void receiveShipment(@Valid @RequestBody InventoryIntakeRequest request, @AuthenticationPrincipal Jwt jwt) {
        UUID staffId = UUID.fromString(jwt.getClaimAsString("userId"));
        inventoryIntakeService.receiveShipment(request, staffId);
    }
}
