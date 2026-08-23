package com.backend.feni.config;

import com.backend.feni.entity.Facility;
import com.backend.feni.entity.StaffUser;
import com.backend.feni.entity.Product;
import com.backend.feni.entity.enums.Role;
import com.backend.feni.entity.enums.ProductType;
import com.backend.feni.entity.enums.RevenueCenter;
import com.backend.feni.entity.RoomType;
import com.backend.feni.repository.FacilityRepository;
import com.backend.feni.repository.StaffUserRepository;
import com.backend.feni.repository.ProductRepository;
import com.backend.feni.repository.RoomTypeRepository;
import com.backend.feni.entity.OutboxEvent;
import com.backend.feni.entity.enums.OutboxStatus;
import com.backend.feni.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.Base64;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final FacilityRepository facilityRepo;
    private final StaffUserRepository staffUserRepo;
    private final ProductRepository productRepo;
    private final RoomTypeRepository roomTypeRepo;
    private final OutboxEventRepository outboxEventRepo;
    private final ObjectMapper objectMapper;
    private final PasswordEncoder passwordEncoder;

    @Value("${bootstrap.facility.name}")
    private String facilityName;

    @Value("${bootstrap.facility.timezone}")
    private String facilityTimezone;

    @Value("${bootstrap.admin.username}")
    private String adminUsername;

    @Value("${bootstrap.admin.password:}")
    private String configuredAdminPassword;

    @Override
    public void run(String... args) {
        seedFacility();
        seedAdmin();
        seedProducts();
        seedRoomTypes();
    }

    private void seedRoomTypes() {
        if (roomTypeRepo.count() > 0) {
            return;
        }
        
        roomTypeRepo.save(RoomType.builder().name("Standard").basePrice(new BigDecimal("15000")).build());
        roomTypeRepo.save(RoomType.builder().name("Deluxe").basePrice(new BigDecimal("25000")).build());
        roomTypeRepo.save(RoomType.builder().name("Suite").basePrice(new BigDecimal("50000")).build());
        
        log.info("Seeded default room types.");
    }

    private void seedFacility() {
        if (facilityRepo.count() > 0) {
            return; // already seeded, never touch it again
        }

        Facility facility = new Facility();
        facility.setName(facilityName);
        facility.setTimezone(facilityTimezone);
        facilityRepo.save(facility);

        log.info("Seeded facility: {}", facilityName);
    }

    private void seedAdmin() {
        boolean adminExists = staffUserRepo.findAll().stream()
                .anyMatch(u -> u.getRole() == Role.ADMIN);

        if (adminExists) {
            return; // idempotent — never reseed on subsequent restarts
        }

        String initialPassword = configuredAdminPassword.isBlank()
                ? generateSecurePassword()
                : configuredAdminPassword;

        StaffUser admin = new StaffUser();
        admin.setUsername(adminUsername);
        admin.setPasswordHash(passwordEncoder.encode(initialPassword));
        admin.setRole(Role.ADMIN);
        admin.setActive(true);
        admin.setMustChangePassword(true); // forces reset on first login, regardless of source

        staffUserRepo.save(admin);

        log.warn("=================================================================");
        log.warn(" FIRST-BOOT ADMIN ACCOUNT CREATED");
        log.warn(" Username: {}", adminUsername);
        log.warn(" Password: {}", initialPassword);
        log.warn(" This password will NOT be shown again. Log in and change it now.");
        log.warn("=================================================================");
    }

    private String generateSecurePassword() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[18]; // 144 bits, comfortably strong
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private void seedProducts() {
        if (productRepo.count() > 0) {
            return;
        }

        seedProductAndSync(Product.builder().name("Starbeer Bottle").type(ProductType.RAW_GOOD).revenueCenter(RevenueCenter.BAR).internalSku("B001").price(new BigDecimal("1500")).unitCost(new BigDecimal("1000")).stockQty(45).build());
        seedProductAndSync(Product.builder().name("Guinness Stout").type(ProductType.RAW_GOOD).revenueCenter(RevenueCenter.BAR).internalSku("B002").price(new BigDecimal("2000")).unitCost(new BigDecimal("1200")).stockQty(32).build());
        seedProductAndSync(Product.builder().name("Jollof Rice & Chicken").type(ProductType.PREPARED_DISH).revenueCenter(RevenueCenter.KITCHEN).internalSku("K001").price(new BigDecimal("4500")).unitCost(new BigDecimal("2500")).build());
        seedProductAndSync(Product.builder().name("Egusi Soup & Pounded Yam").type(ProductType.PREPARED_DISH).revenueCenter(RevenueCenter.KITCHEN).internalSku("K002").price(new BigDecimal("5000")).unitCost(new BigDecimal("3000")).build());
        seedProductAndSync(Product.builder().name("Plantain (Extra)").type(ProductType.PREPARED_DISH).revenueCenter(RevenueCenter.KITCHEN).internalSku("K003").price(new BigDecimal("1000")).unitCost(new BigDecimal("400")).build());
        seedProductAndSync(Product.builder().name("Water (Bottle)").type(ProductType.RAW_GOOD).revenueCenter(RevenueCenter.BAR).internalSku("B003").price(new BigDecimal("500")).unitCost(new BigDecimal("200")).stockQty(105).build());
        seedProductAndSync(Product.builder().name("Red Bull").type(ProductType.RAW_GOOD).revenueCenter(RevenueCenter.BAR).internalSku("B004").price(new BigDecimal("2500")).unitCost(new BigDecimal("1500")).stockQty(5).build());
        seedProductAndSync(Product.builder().name("Grilled Fish").type(ProductType.PREPARED_DISH).revenueCenter(RevenueCenter.KITCHEN).internalSku("K004").price(new BigDecimal("8000")).unitCost(new BigDecimal("5000")).build());

        log.info("Seeded mock products with cloud sync outbox events.");
    }

    private void seedProductAndSync(Product product) {
        Product saved = productRepo.save(product);
        try {
            java.util.Map<String, Object> payloadMap = new java.util.HashMap<>();
            payloadMap.put("product", saved);
            String payload = objectMapper.writeValueAsString(payloadMap);
            
            OutboxEvent event = OutboxEvent.builder()
                    .eventType("PRODUCT_UPSERTED")
                    .payload(payload)
                    .status(OutboxStatus.PENDING)
                    .build();
            outboxEventRepo.save(event);
        } catch (Exception e) {
            log.error("Failed to serialize product for outbox event during seeding", e);
        }
    }
}