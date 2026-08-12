package com.backend.feni.controller;

import com.backend.feni.entity.SystemAlert;
import com.backend.feni.repository.SystemAlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final SystemAlertRepository systemAlertRepo;

    @GetMapping
    public List<SystemAlert> getActiveAlerts(@RequestParam(defaultValue = "false") boolean resolved) {
        if (!resolved) {
            return systemAlertRepo.findByResolvedFalse();
        }
        return systemAlertRepo.findAll();
    }

    @PatchMapping("/{id}/resolve")
    public void resolveAlert(@PathVariable UUID id) {
        SystemAlert alert = systemAlertRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alert not found"));
        alert.setResolved(true);
        systemAlertRepo.save(alert);
    }
}
