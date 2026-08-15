package com.backend.feni.service;

import com.backend.feni.dto.request.RoomRequest;
import com.backend.feni.dto.response.RoomResponse;
import com.backend.feni.entity.Room;
import com.backend.feni.entity.enums.RoomStatus;
import com.backend.feni.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepo;
    private final PromoService promoService;

    @Transactional
    public RoomResponse createRoom(RoomRequest request) {
        if (roomRepo.findByRoomNumber(request.getRoomNumber()).isPresent()) {
            throw new IllegalArgumentException("Room number already exists");
        }

        Room room = Room.builder()
                .roomNumber(request.getRoomNumber())
                .roomType(request.getRoomType())
                .basePrice(request.getBasePrice())
                .status(RoomStatus.AVAILABLE)
                .build();

        return toResponse(roomRepo.save(room));
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> getAllRooms() {
        return roomRepo.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateRoomStatus(UUID id, RoomStatus newStatus) {
        Room room = roomRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        room.setStatus(newStatus);
        roomRepo.save(room);
    }

    @Transactional
    public RoomResponse updateRoom(UUID id, RoomRequest request) {
        Room room = roomRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        
        if (!room.getRoomNumber().equals(request.getRoomNumber())) {
            if (roomRepo.findByRoomNumber(request.getRoomNumber()).isPresent()) {
                throw new IllegalArgumentException("Room number already exists");
            }
            room.setRoomNumber(request.getRoomNumber());
        }
        
        room.setRoomType(request.getRoomType());
        room.setBasePrice(request.getBasePrice());
        
        return toResponse(roomRepo.save(room));
    }

    @Transactional
    public RoomResponse toggleRoomActive(UUID id) {
        Room room = roomRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        
        room.setActive(!room.isActive());
        return toResponse(roomRepo.save(room));
    }

    private RoomResponse toResponse(Room room) {
        BigDecimal discount = promoService.getDiscountPercentageForRoomType(room.getRoomType());
        BigDecimal currentPrice = room.getBasePrice();
        if (discount.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal multiplier = BigDecimal.ONE.subtract(discount.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
            currentPrice = room.getBasePrice().multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
        }

        return RoomResponse.builder()
                .id(room.getId())
                .roomNumber(room.getRoomNumber())
                .roomType(room.getRoomType())
                .status(room.getStatus())
                .basePrice(room.getBasePrice())
                .currentPrice(currentPrice)
                .active(room.isActive())
                .build();
    }
}
