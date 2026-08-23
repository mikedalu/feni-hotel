package com.backend.feni.dto.request;

import lombok.Data;

@Data
public class AdminSettingsRequest {
    private String facilityName;
    private String timezone;
    private String address;
    private String adminEmail;
    private String newPassword;
}
