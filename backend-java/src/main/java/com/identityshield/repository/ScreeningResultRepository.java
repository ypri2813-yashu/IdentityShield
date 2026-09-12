package com.identityshield.repository;

import com.identityshield.model.RiskLevel;
import com.identityshield.model.ScreeningResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ScreeningResultRepository
 * Spring Data JPA repository for screening_results table.
 */
@Repository
public interface ScreeningResultRepository extends JpaRepository<ScreeningResult, Long> {

    List<ScreeningResult> findByDocumentId(Long documentId);

    List<ScreeningResult> findAllByOrderByCreatedAtDesc();

    long countByRiskLevel(RiskLevel riskLevel);
}
