package com.backend.feni.controller;

import com.backend.feni.dto.request.SelfCheckinConfirmRequest;
import com.backend.feni.service.SelfCheckinService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/checkin")
@RequiredArgsConstructor
public class SelfCheckinController {

    private final SelfCheckinService selfCheckinService;

    @PostMapping("/self-checkin/start")
    public Map<String, String> startSession(@AuthenticationPrincipal Jwt jwt) {
        UUID staffId = UUID.fromString(jwt.getClaimAsString("userId"));
        String sessionId = selfCheckinService.startSession(staffId);
        return Map.of("sessionId", sessionId);
    }

    @PostMapping("/confirm/{sessionId}")
    @ResponseStatus(HttpStatus.CREATED)
    public void confirmCheckin(
            @PathVariable String sessionId,
            @Valid @RequestBody SelfCheckinConfirmRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        
        UUID staffId = UUID.fromString(jwt.getClaimAsString("userId"));
        selfCheckinService.confirmCheckin(sessionId, request, staffId);
    }

    @GetMapping("/recover")
    public List<Map<String, Object>> getRecoverableSessions() {
        return selfCheckinService.getRecoverableSessions();
    }
}
