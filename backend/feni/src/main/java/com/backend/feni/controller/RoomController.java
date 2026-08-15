package com.backend.feni.controller;

import com.backend.feni.dto.request.RoomRequest;
import com.backend.feni.dto.request.RoomStatusUpdateRequest;
import com.backend.feni.dto.response.RoomResponse;
import com.backend.feni.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoomResponse createRoom(@Valid @RequestBody RoomRequest request) {
        return roomService.createRoom(request);
    }

    @GetMapping
    public List<RoomResponse> getAllRooms() {
        return roomService.getAllRooms();
    }

    @PatchMapping("/{id}/status")
    public void updateRoomStatus(@PathVariable UUID id, @Valid @RequestBody RoomStatusUpdateRequest request) {
        roomService.updateRoomStatus(id, request.getStatus());
    }

    @PutMapping("/{id}")
    public RoomResponse updateRoom(@PathVariable UUID id, @Valid @RequestBody RoomRequest request) {
        return roomService.updateRoom(id, request);
    }

    @PatchMapping("/{id}/toggle-active")
    public RoomResponse toggleRoomActive(@PathVariable UUID id) {
        return roomService.toggleRoomActive(id);
    }
}
