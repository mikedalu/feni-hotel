package com.backend.feni.service;

import com.backend.feni.dto.request.PromoRequest;
import com.backend.feni.dto.response.PromoResponse;
import com.backend.feni.entity.PromoCampaign;
import com.backend.feni.repository.PromoCampaignRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PromoService {

    private final PromoCampaignRepository promoRepo;

    @Transactional
    public PromoResponse createPromo(PromoRequest request) {
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new IllegalArgumentException("Start date must be before or equal to end date");
        }

        PromoCampaign promo = PromoCampaign.builder()
                .name(request.getName())
                .discountPercentage(request.getDiscountPercentage())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .targetRoomType(request.getTargetRoomType())
                .isActive(request.isActive())
                .build();

        return toResponse(promoRepo.save(promo));
    }

    @Transactional(readOnly = true)
    public List<PromoResponse> getAllPromos() {
        return promoRepo.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void togglePromoStatus(UUID id) {
        PromoCampaign promo = promoRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Promo not found"));
        promo.setActive(!promo.isActive());
        promoRepo.save(promo);
    }

    @Transactional(readOnly = true)
    public BigDecimal getDiscountPercentageForRoomType(String roomType) {
        List<PromoCampaign> activeCampaigns = promoRepo.findActiveCampaignsForDate(LocalDate.now());

        return activeCampaigns.stream()
                .filter(p -> p.getTargetRoomType().equalsIgnoreCase(roomType)
                        || p.getTargetRoomType().equalsIgnoreCase("ALL"))
                .map(PromoCampaign::getDiscountPercentage)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
    }

    private PromoResponse toResponse(PromoCampaign promo) {
        return PromoResponse.builder()
                .id(promo.getId())
                .name(promo.getName())
                .discountPercentage(promo.getDiscountPercentage())
                .startDate(promo.getStartDate())
                .endDate(promo.getEndDate())
                .targetRoomType(promo.getTargetRoomType())
                .isActive(promo.isActive())
                .build();
    }
}
