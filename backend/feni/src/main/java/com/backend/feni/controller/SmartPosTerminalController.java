package com.backend.feni.controller;

import com.backend.feni.dto.request.SmartPosTerminalRequest;
import com.backend.feni.dto.response.SmartPosTerminalResponse;
import com.backend.feni.service.SmartPosTerminalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/smart-pos")
@RequiredArgsConstructor
public class SmartPosTerminalController {

    private final SmartPosTerminalService service;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SmartPosTerminalResponse> createTerminal(@Valid @RequestBody SmartPosTerminalRequest request) {
        return ResponseEntity.ok(service.createTerminal(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FRONT_DESK', 'BARTENDER')")
    public ResponseEntity<List<SmartPosTerminalResponse>> getAllTerminals() {
        return ResponseEntity.ok(service.getAllTerminals());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SmartPosTerminalResponse> updateTerminal(@PathVariable UUID id, @Valid @RequestBody SmartPosTerminalRequest request) {
        return ResponseEntity.ok(service.updateTerminal(id, request));
    }
}
