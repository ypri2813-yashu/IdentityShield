package com.identityshield.controller;

import com.identityshield.model.RiskLevel;
import com.identityshield.model.ScreeningCase;
import com.identityshield.model.ScreeningResult;
import com.identityshield.repository.CaseRepository;
import com.identityshield.repository.DocumentRepository;
import com.identityshield.repository.ScreeningResultRepository;
import com.identityshield.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * ReportController
 * REST Controller for generating analytics reports and compliance summaries:
 *  - GET /api/reports
 *  - GET /api/reports/{caseId}
 */
@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    private final CaseRepository caseRepository;
    private final DocumentRepository documentRepository;
    private final ScreeningResultRepository screeningResultRepository;
    private final AuditLogService auditLogService;

    public ReportController(CaseRepository caseRepository,
                            DocumentRepository documentRepository,
                            ScreeningResultRepository screeningResultRepository,
                            AuditLogService auditLogService) {
        this.caseRepository = caseRepository;
        this.documentRepository = documentRepository;
        this.screeningResultRepository = screeningResultRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getSummaryReport() {
        // Audit log action
        auditLogService.logAction(null, "REPORT_VIEWED", "Comprehensive screening report viewed");

        Map<String, Object> report = new LinkedHashMap<>();

        long totalScreened = screeningResultRepository.count();
        long lowRisk = screeningResultRepository.countByRiskLevel(RiskLevel.LOW);
        long mediumRisk = screeningResultRepository.countByRiskLevel(RiskLevel.MEDIUM);
        long highRisk = screeningResultRepository.countByRiskLevel(RiskLevel.HIGH);

        report.put("totalDocumentsScreened", totalScreened);
        report.put("lowRiskCount", lowRisk);
        report.put("mediumRiskCount", mediumRisk);
        report.put("highRiskCount", highRisk);

        // Calculate risk distribution percentages
        double highRiskPct = totalScreened > 0 ? ((double) highRisk / totalScreened) * 100.0 : 0.0;
        double mediumRiskPct = totalScreened > 0 ? ((double) mediumRisk / totalScreened) * 100.0 : 0.0;
        double lowRiskPct = totalScreened > 0 ? ((double) lowRisk / totalScreened) * 100.0 : 0.0;

        report.put("highRiskPercentage", Math.round(highRiskPct * 10.0) / 10.0);
        report.put("mediumRiskPercentage", Math.round(mediumRiskPct * 10.0) / 10.0);
        report.put("lowRiskPercentage", Math.round(lowRiskPct * 10.0) / 10.0);

        // Recent screening results for investigator quick inspection
        List<ScreeningResult> recentResults = screeningResultRepository.findAllByOrderByCreatedAtDesc();
        report.put("recentResults", recentResults.subList(0, Math.min(10, recentResults.size())));

        return ResponseEntity.ok(report);
    }

    @GetMapping("/{caseId}")
    public ResponseEntity<Map<String, Object>> getCaseReport(@PathVariable Long caseId) {
        auditLogService.logAction(caseId, "REPORT_VIEWED", "Detailed case report viewed for case #" + caseId);

        Optional<ScreeningCase> caseOpt = caseRepository.findById(caseId);
        if (caseOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ScreeningCase screeningCase = caseOpt.get();
        Map<String, Object> caseReport = new LinkedHashMap<>();
        caseReport.put("case", screeningCase);
        caseReport.put("documentsCount", screeningCase.getDocuments().size());

        List<ScreeningResult> results = new ArrayList<>();
        screeningCase.getDocuments().forEach(d -> results.addAll(d.getScreeningResults()));
        caseReport.put("results", results);

        return ResponseEntity.ok(caseReport);
    }
}
