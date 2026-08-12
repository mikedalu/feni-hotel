package com.backend.feni.controller;

import com.backend.feni.dto.request.PosSaleRequest;
import com.backend.feni.service.PosSaleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/pos")
@RequiredArgsConstructor
public class PosSaleController {

    private final PosSaleService posSaleService;

    @PostMapping("/sale")
    @ResponseStatus(HttpStatus.CREATED)
    public void completeSale(@Valid @RequestBody PosSaleRequest request, @AuthenticationPrincipal Jwt jwt) {
        UUID staffId = UUID.fromString(jwt.getClaimAsString("userId"));
        posSaleService.completeSale(request, staffId);
    }
}
