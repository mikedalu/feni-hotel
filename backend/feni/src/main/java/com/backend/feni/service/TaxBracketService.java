package com.backend.feni.service;

import com.backend.feni.dto.request.TaxBracketRequest;
import com.backend.feni.dto.response.TaxBracketResponse;
import com.backend.feni.entity.TaxBracket;
import com.backend.feni.repository.TaxBracketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaxBracketService {

    private final TaxBracketRepository taxBracketRepo;

    @Transactional
    public TaxBracketResponse createTaxBracket(TaxBracketRequest request) {
        TaxBracket bracket = TaxBracket.builder()
                .name(request.getName())
                .rate(request.getRate())
                .liabilityAccountName(request.getLiabilityAccountName())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        
        bracket = taxBracketRepo.save(bracket);
        return mapToResponse(bracket);
    }

    @Transactional(readOnly = true)
    public List<TaxBracketResponse> getAllTaxBrackets() {
        return taxBracketRepo.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TaxBracketResponse updateTaxBracket(UUID id, TaxBracketRequest request) {
        TaxBracket bracket = taxBracketRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("TaxBracket not found"));

        bracket.setName(request.getName());
        bracket.setRate(request.getRate());
        bracket.setLiabilityAccountName(request.getLiabilityAccountName());
        if (request.getIsActive() != null) {
            bracket.setIsActive(request.getIsActive());
        }

        bracket = taxBracketRepo.save(bracket);
        return mapToResponse(bracket);
    }

    private TaxBracketResponse mapToResponse(TaxBracket bracket) {
        return TaxBracketResponse.builder()
                .id(bracket.getId())
                .name(bracket.getName())
                .rate(bracket.getRate())
                .liabilityAccountName(bracket.getLiabilityAccountName())
                .isActive(bracket.getIsActive())
                .build();
    }
}
