package com.backend.feni.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.UUID;

@Entity
@Table(name = "guests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Guest {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String phone;
    
    // Additional Optional Fields from Physical Form
    private String title;
    private String occupation;
    private String nextOfKinPhone;
    private String address;
    private String lga;
    private String nationality;
    private String stateOfOrigin;
    private String passportNo;
    private String purposeOfVisit;
    private String arrivingFrom;
    private String goingTo;

    // Optional link to R2 ID scan
    private String idScanUrl;
}
