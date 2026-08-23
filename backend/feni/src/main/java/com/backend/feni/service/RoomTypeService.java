package com.backend.feni.service;

import com.backend.feni.dto.request.RoomTypeRequest;
import com.backend.feni.dto.response.RoomTypeResponse;
import com.backend.feni.entity.RoomType;
import com.backend.feni.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomTypeService {

    private final RoomTypeRepository roomTypeRepository;

    public List<RoomTypeResponse> getAllRoomTypes() {
        return roomTypeRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public RoomTypeResponse createRoomType(RoomTypeRequest request) {
        if (roomTypeRepository.findByName(request.getName()).isPresent()) {
            throw new IllegalArgumentException("Room type with this name already exists");
        }
        
        RoomType roomType = RoomType.builder()
                .name(request.getName())
                .basePrice(request.getBasePrice())
                .build();
                
        try {
            RoomType saved = roomTypeRepository.save(roomType);
            return mapToResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Room type with this name already exists");
        }
    }

    public RoomTypeResponse updateRoomType(UUID id, RoomTypeRequest request) {
        RoomType roomType = roomTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Room type not found"));
                
        if (!roomType.getName().equalsIgnoreCase(request.getName())) {
            if (roomTypeRepository.findByName(request.getName()).isPresent()) {
                throw new IllegalArgumentException("Room type with this name already exists");
            }
        }

        roomType.setName(request.getName());
        roomType.setBasePrice(request.getBasePrice());

        RoomType updated = roomTypeRepository.save(roomType);
        return mapToResponse(updated);
    }
    
    public void deleteRoomType(UUID id) {
        RoomType roomType = roomTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Room type not found"));
        roomTypeRepository.delete(roomType);
    }

    private RoomTypeResponse mapToResponse(RoomType roomType) {
        return RoomTypeResponse.builder()
                .id(roomType.getId())
                .name(roomType.getName())
                .basePrice(roomType.getBasePrice())
                .createdAt(roomType.getCreatedAt())
                .updatedAt(roomType.getUpdatedAt())
                .build();
    }
}
