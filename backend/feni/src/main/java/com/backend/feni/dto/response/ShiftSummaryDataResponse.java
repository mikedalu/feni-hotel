package com.backend.feni.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class ShiftSummaryDataResponse {
    private String guestName;
    private String guestPhone;
    private String guestOccupation;
    private String guestAddress;
    private String guestNationality;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private String roomNumber;
    private String purposeOfVisit;
    private String stateOfOrigin;
    private String lga;
    private String nextOfKinPhone;
}
