package com.backend.feni.service;

import com.backend.feni.dto.request.PosSaleItemRequest;
import com.backend.feni.dto.request.PosSaleRequest;
import com.backend.feni.entity.JournalEntry;
import com.backend.feni.entity.OutboxEvent;
import com.backend.feni.entity.Product;
import com.backend.feni.entity.enums.EntryType;
import com.backend.feni.entity.enums.ProductType;
import com.backend.feni.repository.JournalEntryRepository;
import com.backend.feni.repository.OutboxEventRepository;
import com.backend.feni.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@Testcontainers
public class PosSaleServiceIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    @Autowired
    private PosSaleService posSaleService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private JournalEntryRepository journalEntryRepository;

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @Autowired
    private StaffUserRepository staffRepository;

    @BeforeEach
    void setUp() {
        productRepository.deleteAll();
        journalEntryRepository.deleteAll();
        outboxEventRepository.deleteAll();
        staffRepository.deleteAll();
    }

    @Test
    @org.springframework.transaction.annotation.Transactional
    void testCompleteSale_Success() {
        // Arrange
        StaffUser staff = StaffUser.builder()
                .username("teststaff")
                .passwordHash("hash")
                .role(com.backend.feni.entity.enums.Role.BARTENDER)
                .mustChangePassword(false)
                .build();
        staff = staffRepository.save(staff);

        Product beer = Product.builder()
                .name("Test Beer")
                .type(ProductType.RAW_GOOD)
                .internalSku("SKU-BEER")
                .stockQty(10)
                .price(new BigDecimal("5.00"))
                .unitCost(new BigDecimal("2.00"))
                .build();
        productRepository.save(beer);

        PosSaleItemRequest itemReq = new PosSaleItemRequest();
        itemReq.setSkuOrBarcode("SKU-BEER");
        itemReq.setQuantity(2);

        PosSaleRequest saleReq = new PosSaleRequest();
        saleReq.setItems(List.of(itemReq));

        // Act
        posSaleService.completeSale(saleReq, staff.getId());

        // Assert
        // 1. Stock decremented
        Product updatedBeer = productRepository.findByInternalSku("SKU-BEER").orElseThrow();
        assertEquals(8, updatedBeer.getStockQty());

        // 2. Journal Entry created with 4 lines
        List<JournalEntry> entries = journalEntryRepository.findAll();
        assertEquals(1, entries.size());
        JournalEntry entry = entries.get(0);
        assertEquals(EntryType.SALE, entry.getEntryType());
        assertEquals(4, entry.getLines().size());

        // 3. Outbox Event created
        List<OutboxEvent> outboxEvents = outboxEventRepository.findAll();
        assertEquals(1, outboxEvents.size());
        OutboxEvent event = outboxEvents.get(0);
        assertEquals("SALE_COMPLETED", event.getEventType());
        assertNotNull(event.getPayload());
    }
}
