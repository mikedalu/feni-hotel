package com.backend.feni.service;

import com.backend.feni.dto.request.SmartPosTerminalRequest;
import com.backend.feni.dto.response.SmartPosTerminalResponse;
import com.backend.feni.entity.SmartPosTerminal;
import com.backend.feni.repository.SmartPosTerminalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SmartPosTerminalService {

    private final SmartPosTerminalRepository repository;

    @Transactional
    public SmartPosTerminalResponse createTerminal(SmartPosTerminalRequest request) {
        SmartPosTerminal terminal = SmartPosTerminal.builder()
                .name(request.getName())
                .serialNumber(request.getSerialNumber())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        
        terminal = repository.save(terminal);
        return mapToResponse(terminal);
    }

    @Transactional(readOnly = true)
    public List<SmartPosTerminalResponse> getAllTerminals() {
        return repository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SmartPosTerminalResponse updateTerminal(UUID id, SmartPosTerminalRequest request) {
        SmartPosTerminal terminal = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Smart POS Terminal not found"));

        terminal.setName(request.getName());
        terminal.setSerialNumber(request.getSerialNumber());
        if (request.getIsActive() != null) {
            terminal.setIsActive(request.getIsActive());
        }

        terminal = repository.save(terminal);
        return mapToResponse(terminal);
    }

    private SmartPosTerminalResponse mapToResponse(SmartPosTerminal terminal) {
        return SmartPosTerminalResponse.builder()
                .id(terminal.getId())
                .name(terminal.getName())
                .serialNumber(terminal.getSerialNumber())
                .isActive(terminal.getIsActive())
                .build();
    }
}
