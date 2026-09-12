package com.identityshield.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.identityshield.exception.ResourceNotFoundException;
import com.identityshield.model.*;
import com.identityshield.repository.CaseRepository;
import com.identityshield.repository.DocumentRepository;
import com.identityshield.repository.ScreeningResultRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

/**
 * DocumentService
 * Manages document storage, links documents to screening cases,
 * coordinates calls to the Python ML screening engine, and persists results.
 */
@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final CaseRepository caseRepository;
    private final ScreeningResultRepository screeningResultRepository;
    private final MlScreeningService mlScreeningService;
    private final ConsistencyCheckService consistencyCheckService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${identityshield.upload.dir:./uploads}")
    private String uploadDir;

    public DocumentService(DocumentRepository documentRepository,
                           CaseRepository caseRepository,
                           ScreeningResultRepository screeningResultRepository,
                           MlScreeningService mlScreeningService,
                           ConsistencyCheckService consistencyCheckService,
                           AuditLogService auditLogService) {
        this.documentRepository = documentRepository;
        this.caseRepository = caseRepository;
        this.screeningResultRepository = screeningResultRepository;
        this.mlScreeningService = mlScreeningService;
        this.consistencyCheckService = consistencyCheckService;
        this.auditLogService = auditLogService;
    }

    /**
     * Uploads and associates a new document with an existing case.
     */
    @Transactional
    public Document uploadDocument(Long caseId, MultipartFile file, String documentType) throws IOException {
        ScreeningCase screeningCase = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Screening case with ID " + caseId + " not found"));

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file.");
        }

        // 1. Save file locally
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.jpg";
        String storedFilename = System.currentTimeMillis() + "_" + originalFilename;
        Path destination = uploadPath.resolve(storedFilename);
        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

        // 2. Create Document entity
        Document document = new Document();
        document.setScreeningCase(screeningCase);
        document.setFileName(originalFilename);
        document.setStoredFilePath(destination.toString());
        document.setDocumentType(documentType != null ? documentType.toUpperCase() : "SUPPORTING_DOC");
        document.setFileSizeBytes(file.getSize());
        document.setMimeType(file.getContentType());

        Document savedDoc = documentRepository.save(document);

        // 3. Log Audit
        auditLogService.logAction(caseId, "DOCUMENT_UPLOADED",
                "Uploaded document: " + originalFilename + " (" + document.getDocumentType() + ")");

        return savedDoc;
    }

    /**
     * Runs CNN visual classification, OpenCV image metrics, and Tesseract OCR for a specific document.
     */
    @Transactional
    public ScreeningResult screenDocument(Long documentId) throws IOException {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document with ID " + documentId + " not found"));

        ScreeningCase screeningCase = document.getScreeningCase();
        Long caseId = screeningCase != null ? screeningCase.getId() : null;

        auditLogService.logAction(caseId, "SCREENING_STARTED",
                "Screening started for document: " + document.getFileName());

        // 1. Read file bytes
        byte[] fileBytes;
        Path filePath = Paths.get(document.getStoredFilePath());
        if (Files.exists(filePath)) {
            fileBytes = Files.readAllBytes(filePath);
        } else {
            throw new ResourceNotFoundException("Physical file not found on disk at: " + document.getStoredFilePath());
        }

        // 2. Call Python ML Microservice
        MlScreeningResponse mlResponse = mlScreeningService.callPythonScreening(fileBytes, document.getFileName());

        // 3. Perform Cross-Document Consistency Check
        ConsistencyCheckService.ConsistencyReport consistencyReport =
                consistencyCheckService.checkCaseConsistency(screeningCase, document, mlResponse.getExtractedFields());

        // 4. Calculate Final Adjusted Risk Score (incorporating cross-document inconsistencies if present)
        int finalRiskScore = mlResponse.getRiskScore() != null ? mlResponse.getRiskScore() : 0;
        if (consistencyReport.isInconsistencyDetected()) {
            finalRiskScore = Math.min(100, finalRiskScore + consistencyReport.getAdditionalRiskPoints());
        }

        RiskLevel finalRiskLevel;
        String finalMessage;
        if (finalRiskScore >= 60) {
            finalRiskLevel = RiskLevel.HIGH;
            finalMessage = "High Risk — Further Verification Recommended";
        } else if (finalRiskScore >= 30) {
            finalRiskLevel = RiskLevel.MEDIUM;
            finalMessage = "Medium Risk — Review Recommended";
        } else {
            finalRiskLevel = RiskLevel.LOW;
            finalMessage = "Low Risk — Standard processing eligible";
        }

        // 5. Build and save ScreeningResult
        ScreeningResult result = new ScreeningResult();
        result.setDocument(document);
        result.setCnnPrediction(mlResponse.getCnnPrediction() != null ? mlResponse.getCnnPrediction() : "Normal");
        result.setCnnConfidence(BigDecimal.valueOf(mlResponse.getCnnConfidence() != null ? mlResponse.getCnnConfidence() : 0.5000));
        result.setOcrConfidence(BigDecimal.valueOf(mlResponse.getOcrConfidence() != null ? mlResponse.getOcrConfidence() : 0.0000));
        result.setAnomalyScore(BigDecimal.valueOf(mlResponse.getAnomalyScore() != null ? mlResponse.getAnomalyScore() : 0.0000));
        result.setRiskScore(finalRiskScore);
        result.setRiskLevel(finalRiskLevel);
        result.setExtractedText(mlResponse.getExtractedText());
        result.setRecommendationMessage(finalMessage);
        result.setConsistencyNotes(consistencyReport.getSummaryNote());

        try {
            if (mlResponse.getExtractedFields() != null) {
                result.setExtractedFieldsJson(objectMapper.writeValueAsString(mlResponse.getExtractedFields()));
            }
            if (mlResponse.getImageSignals() != null) {
                result.setImageSignalsJson(objectMapper.writeValueAsString(mlResponse.getImageSignals()));
            }
        } catch (Exception ignored) {
        }

        ScreeningResult savedResult = screeningResultRepository.save(result);
        document.getScreeningResults().add(savedResult);

        // 6. Update overall case risk score (highest risk document in case)
        updateCaseOverallRisk(screeningCase);

        // 7. Audit log completion
        auditLogService.logAction(caseId, "SCREENING_COMPLETED",
                "Screening completed for " + document.getFileName() + ". Score: " + finalRiskScore + " (" + finalRiskLevel + ")");

        return savedResult;
    }

    private void updateCaseOverallRisk(ScreeningCase screeningCase) {
        if (screeningCase == null) return;

        int maxRiskScore = 0;
        RiskLevel highestLevel = RiskLevel.LOW;

        for (Document doc : screeningCase.getDocuments()) {
            for (ScreeningResult r : doc.getScreeningResults()) {
                if (r.getRiskScore() > maxRiskScore) {
                    maxRiskScore = r.getRiskScore();
                    highestLevel = r.getRiskLevel();
                }
            }
        }

        screeningCase.setOverallRiskScore(maxRiskScore);
        screeningCase.setOverallRiskLevel(highestLevel);
        screeningCase.setStatus(highestLevel == RiskLevel.HIGH ? "REVIEW_REQUIRED" : "COMPLETED");
        caseRepository.save(screeningCase);
    }

    public List<Document> getDocumentsByCase(Long caseId) {
        return documentRepository.findByScreeningCaseId(caseId);
    }

    public Document getDocumentById(Long documentId) {
        return documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document with ID " + documentId + " not found"));
    }
}
