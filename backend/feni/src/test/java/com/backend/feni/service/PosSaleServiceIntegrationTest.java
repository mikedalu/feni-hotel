package com.backend.feni.service;

import com.backend.feni.dto.request.PosSaleItemRequest;
import com.backend.feni.dto.request.PosSaleRequest;
import com.backend.feni.entity.JournalEntry;
import com.backend.feni.entity.OutboxEvent;
import com.backend.feni.entity.Product;
import com.backend.feni.entity.enums.EntryType;
import com.backend.feni.entity.enums.ProductType;
import com.backend.feni.entity.StaffUser;
import com.backend.feni.repository.JournalEntryRepository;
import com.backend.feni.repository.OutboxEventRepository;
import com.backend.feni.repository.ProductRepository;
import com.backend.feni.repository.StaffUserRepository;
import com.backend.feni.repository.InventoryLocationRepository;
import com.backend.feni.repository.InventoryStockRepository;
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

    @Autowired
    private InventoryLocationRepository locationRepository;

    @Autowired
    private InventoryStockRepository stockRepository;

    @BeforeEach
    void setUp() {
        stockRepository.deleteAll();
        productRepository.deleteAll();
        locationRepository.deleteAll();
        journalEntryRepository.deleteAll();
        outboxEventRepository.deleteAll();
        staffRepository.deleteAll();
    }

    @Test
    @org.springframework.transaction.annotation.Transactional
    void testCompleteSale_Success() {
        // Arrange
        StaffUser staff = new StaffUser();
        staff.setUsername("teststaff");
        staff.setPasswordHash("hash");
        staff.setRole(com.backend.feni.entity.enums.Role.BARTENDER);
        staff.setMustChangePassword(false);
        staff = staffRepository.save(staff);

        com.backend.feni.entity.InventoryLocation barLocation = new com.backend.feni.entity.InventoryLocation();
        barLocation.setName("Main Bar");
        barLocation.setType(com.backend.feni.entity.enums.LocationType.BAR);
        barLocation = locationRepository.save(barLocation);

        Product beer = Product.builder()
                .name("Test Beer")
                .type(ProductType.RAW_GOOD)
                .internalSku("SKU-BEER")
                .price(new BigDecimal("5.00"))
                .unitCost(new BigDecimal("2.00"))
                .revenueCenter(com.backend.feni.entity.enums.RevenueCenter.BAR)
                .build();
        beer = productRepository.save(beer);

        com.backend.feni.entity.InventoryStock stock = new com.backend.feni.entity.InventoryStock();
        stock.setProduct(beer);
        stock.setLocation(barLocation);
        stock.setQuantity(10);
        stockRepository.save(stock);

        PosSaleItemRequest itemReq = new PosSaleItemRequest();
        itemReq.setSkuOrBarcode("SKU-BEER");
        itemReq.setQuantity(2);

        PosSaleRequest saleReq = new PosSaleRequest();
        saleReq.setLocationId(barLocation.getId());
        saleReq.setItems(List.of(itemReq));
        PosSaleRequest.SplitTenderRequest splitTender = new PosSaleRequest.SplitTenderRequest();
        splitTender.setPaymentMethod(com.backend.feni.entity.enums.PaymentMethod.CASH);
        splitTender.setAmount(new BigDecimal("10.00"));
        saleReq.setSplitTenders(List.of(splitTender));

        // Act
        posSaleService.completeSale(saleReq, staff.getId());

        // Assert
        // 1. Stock decremented
        Product updatedBeer = productRepository.findByInternalSku("SKU-BEER").orElseThrow();
        com.backend.feni.entity.InventoryStock updatedStock = stockRepository.findByProductAndLocation(updatedBeer, barLocation).orElseThrow();
        assertEquals(8, updatedStock.getQuantity());

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
