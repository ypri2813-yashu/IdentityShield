package com.identityshield.repository;

import com.identityshield.model.RiskLevel;
import com.identityshield.model.ScreeningCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * CaseRepository
 * Spring Data JPA repository for screening_cases table.
 */
@Repository
public interface CaseRepository extends JpaRepository<ScreeningCase, Long> {

    Optional<ScreeningCase> findByCaseNumber(String caseNumber);

    List<ScreeningCase> findAllByOrderByCreatedAtDesc();

    long countByOverallRiskLevel(RiskLevel riskLevel);
}
