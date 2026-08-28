package com.backend.feni.controller;

import com.backend.feni.dto.response.GuestResponse;
import com.backend.feni.service.GuestService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/guests")
@RequiredArgsConstructor
public class GuestController {

    private final GuestService guestService;

    @GetMapping
    public List<GuestResponse> getAllGuests() {
        return guestService.getAllGuests();
    }

    @GetMapping("/{id}")
    public GuestResponse getGuestById(@PathVariable UUID id) {
        return guestService.getGuestById(id);
    }
}
