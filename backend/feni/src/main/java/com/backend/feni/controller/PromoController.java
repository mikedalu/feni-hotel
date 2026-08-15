package com.backend.feni.controller;

import com.backend.feni.dto.request.PromoRequest;
import com.backend.feni.dto.response.PromoResponse;
import com.backend.feni.service.PromoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/promos")
@RequiredArgsConstructor
public class PromoController {

    private final PromoService promoService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PromoResponse createPromo(@Valid @RequestBody PromoRequest request) {
        return promoService.createPromo(request);
    }

    @GetMapping
    public List<PromoResponse> getAllPromos() {
        return promoService.getAllPromos();
    }

    @PatchMapping("/{id}/toggle")
    public void togglePromoStatus(@PathVariable UUID id) {
        promoService.togglePromoStatus(id);
    }
}
