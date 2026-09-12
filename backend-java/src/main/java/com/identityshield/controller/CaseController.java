package com.identityshield.controller;

import com.identityshield.model.Document;
import com.identityshield.model.ScreeningCase;
import com.identityshield.model.ScreeningResult;
import com.identityshield.service.CaseService;
import com.identityshield.service.DocumentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * CaseController
 * REST Controller for Managing Screening Cases and Document Uploads:
 *  - POST /api/cases
 *  - GET  /api/cases
 *  - GET  /api/cases/{id}
 *  - POST /api/cases/{caseId}/documents (multipart file upload)
 *  - GET  /api/cases/{caseId}/results
 *  - GET  /api/cases/dashboard
 */
@RestController
@RequestMapping("/api/cases")
@CrossOrigin(origins = "*")
public class CaseController {

    private final CaseService caseService;
    private final DocumentService documentService;

    public CaseController(CaseService caseService, DocumentService documentService) {
        this.caseService = caseService;
        this.documentService = documentService;
    }

    @PostMapping
    public ResponseEntity<ScreeningCase> createCase(@RequestBody ScreeningCase caseRequest) {
        ScreeningCase createdCase = caseService.createCase(caseRequest);
        return new ResponseEntity<>(createdCase, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ScreeningCase>> getAllCases() {
        return ResponseEntity.ok(caseService.getAllCases());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScreeningCase> getCaseById(@PathVariable Long id) {
        return ResponseEntity.ok(caseService.getCaseById(id));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        return ResponseEntity.ok(caseService.getDashboardStats());
    }

    /**
     * Uploads a document to a specific case.
     * Supports multipart/form-data.
     */
    @PostMapping(value = "/{caseId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Document> uploadDocumentToCase(
            @PathVariable Long caseId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "documentType", defaultValue = "SUPPORTING_DOC") String documentType) throws IOException {

        Document savedDoc = documentService.uploadDocument(caseId, file, documentType);
        return new ResponseEntity<>(savedDoc, HttpStatus.CREATED);
    }

    /**
     * Retrieves all screening results for all documents under a given case.
     */
    @GetMapping("/{caseId}/results")
    public ResponseEntity<List<ScreeningResult>> getCaseResults(@PathVariable Long caseId) {
        ScreeningCase screeningCase = caseService.getCaseById(caseId);
        List<ScreeningResult> allResults = new ArrayList<>();
        if (screeningCase.getDocuments() != null) {
            for (Document doc : screeningCase.getDocuments()) {
                if (doc.getScreeningResults() != null) {
                    allResults.addAll(doc.getScreeningResults());
                }
            }
        }
        return ResponseEntity.ok(allResults);
    }
}
