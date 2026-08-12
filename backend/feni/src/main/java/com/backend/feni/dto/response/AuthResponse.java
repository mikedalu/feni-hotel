package com.backend.feni.dto.response;

import com.backend.feni.entity.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String username;
    private Role role;
    private boolean mustChangePassword;
}