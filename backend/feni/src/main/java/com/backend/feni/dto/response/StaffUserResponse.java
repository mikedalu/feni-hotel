package com.backend.feni.dto.response;

import com.backend.feni.entity.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class StaffUserResponse {
    private UUID id;
    private String username;
    private Role role;
    private boolean active;
}