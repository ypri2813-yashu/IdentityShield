package com.identityshield.service;

import com.identityshield.exception.ResourceNotFoundException;
import com.identityshield.model.RiskLevel;
import com.identityshield.model.ScreeningCase;
import com.identityshield.repository.CaseRepository;
import com.identityshield.repository.DocumentRepository;
import com.identityshield.repository.ScreeningResultRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * CaseService
 * Handles business logic for screening cases: creation, retrieval,
 * and high-level dashboard metrics computation.
 */
@Service
public class CaseService {

    private final CaseRepository caseRepository;
    private final DocumentRepository documentRepository;
    private final ScreeningResultRepository screeningResultRepository;
    private final AuditLogService auditLogService;

    public CaseService(CaseRepository caseRepository,
                       DocumentRepository documentRepository,
                       ScreeningResultRepository screeningResultRepository,
                       AuditLogService auditLogService) {
        this.caseRepository = caseRepository;
        this.documentRepository = documentRepository;
        this.screeningResultRepository = screeningResultRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public ScreeningCase createCase(ScreeningCase caseRequest) {
        if (caseRequest.getCaseNumber() == null || caseRequest.getCaseNumber().trim().isEmpty()) {
            caseRequest.setCaseNumber("CASE-" + (1000 + caseRepository.count() + 1));
        }

        if (caseRequest.getStatus() == null) {
            caseRequest.setStatus("PENDING");
        }
        if (caseRequest.getOverallRiskLevel() == null) {
            caseRequest.setOverallRiskLevel(RiskLevel.LOW);
        }
        if (caseRequest.getOverallRiskScore() == null) {
            caseRequest.setOverallRiskScore(0);
        }

        ScreeningCase savedCase = caseRepository.save(caseRequest);

        // Audit Log
        auditLogService.logAction(savedCase.getId(), "CASE_CREATED",
                "Screening case created: " + savedCase.getCaseNumber() + " (" + savedCase.getCaseName() + ")");

        return savedCase;
    }

    public List<ScreeningCase> getAllCases() {
        return caseRepository.findAllByOrderByCreatedAtDesc();
    }

    public ScreeningCase getCaseById(Long id) {
        return caseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Screening case with ID " + id + " not found"));
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new LinkedHashMap<>();

        long totalCases = caseRepository.count();
        long totalDocuments = documentRepository.count();
        long highRiskCases = caseRepository.countByOverallRiskLevel(RiskLevel.HIGH);
        long mediumRiskCases = caseRepository.countByOverallRiskLevel(RiskLevel.MEDIUM);
        long lowRiskCases = caseRepository.countByOverallRiskLevel(RiskLevel.LOW);

        stats.put("totalCases", totalCases);
        stats.put("totalDocumentsScreened", totalDocuments);
        stats.put("highRiskCases", highRiskCases);
        stats.put("mediumRiskCases", mediumRiskCases);
        stats.put("lowRiskCases", lowRiskCases);

        // Include 5 most recent cases
        List<ScreeningCase> recentCases = caseRepository.findAllByOrderByCreatedAtDesc();
        stats.put("recentCases", recentCases.subList(0, Math.min(5, recentCases.size())));

        return stats;
    }
}
