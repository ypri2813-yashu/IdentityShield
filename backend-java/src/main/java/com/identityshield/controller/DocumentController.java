package com.identityshield.controller;

import com.identityshield.model.Document;
import com.identityshield.model.ScreeningResult;
import com.identityshield.service.DocumentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

/**
 * DocumentController
 * REST Controller for document operations:
 *  - POST /api/documents/{documentId}/screen
 *  - GET  /api/documents/{documentId}
 */
@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "*")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    /**
     * Executes CNN visual screening + OpenCV + OCR + consistency checks for a document.
     */
    @PostMapping("/{documentId}/screen")
    public ResponseEntity<ScreeningResult> screenDocument(@PathVariable Long documentId) throws IOException {
        ScreeningResult result = documentService.screenDocument(documentId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{documentId}")
    public ResponseEntity<Document> getDocument(@PathVariable Long documentId) {
        return ResponseEntity.ok(documentService.getDocumentById(documentId));
    }
}
