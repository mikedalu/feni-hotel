package com.backend.feni.controller;

import com.backend.feni.dto.request.TaxBracketRequest;
import com.backend.feni.dto.response.TaxBracketResponse;
import com.backend.feni.service.TaxBracketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/tax-brackets")
@RequiredArgsConstructor
public class TaxBracketController {

    private final TaxBracketService taxBracketService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaxBracketResponse> createTaxBracket(@Valid @RequestBody TaxBracketRequest request) {
        return ResponseEntity.ok(taxBracketService.createTaxBracket(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TaxBracketResponse>> getAllTaxBrackets() {
        return ResponseEntity.ok(taxBracketService.getAllTaxBrackets());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaxBracketResponse> updateTaxBracket(@PathVariable UUID id, @Valid @RequestBody TaxBracketRequest request) {
        return ResponseEntity.ok(taxBracketService.updateTaxBracket(id, request));
    }
}
