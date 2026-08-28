package com.backend.feni.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;
import java.util.List;

@Data
@Builder
public class GuestResponse {
    private UUID id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    
    private String title;
    private String occupation;
    private String nextOfKinPhone;
    private String address;
    private String lga;
    private String nationality;
    private String stateOfOrigin;
    private String passportNo;
    private String nin;
    private String purposeOfVisit;
    private String arrivingFrom;
    private String goingTo;
    
    private String idScanUrl;
    
    private List<BookingResponse> bookings;
}
