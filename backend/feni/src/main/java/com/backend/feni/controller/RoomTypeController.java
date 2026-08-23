package com.backend.feni.controller;

import com.backend.feni.dto.request.RoomTypeRequest;
import com.backend.feni.dto.response.RoomTypeResponse;
import com.backend.feni.service.RoomTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/room-types")
@RequiredArgsConstructor
public class RoomTypeController {

    private final RoomTypeService roomTypeService;

    @GetMapping
    public ResponseEntity<List<RoomTypeResponse>> getAllRoomTypes() {
        return ResponseEntity.ok(roomTypeService.getAllRoomTypes());
    }

    @PostMapping
    public ResponseEntity<RoomTypeResponse> createRoomType(@Valid @RequestBody RoomTypeRequest request) {
        return ResponseEntity.ok(roomTypeService.createRoomType(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoomTypeResponse> updateRoomType(
            @PathVariable UUID id,
            @Valid @RequestBody RoomTypeRequest request) {
        return ResponseEntity.ok(roomTypeService.updateRoomType(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoomType(@PathVariable UUID id) {
        roomTypeService.deleteRoomType(id);
        return ResponseEntity.ok().build();
    }
}
