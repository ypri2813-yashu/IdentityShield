package com.identityshield.controller;

import com.identityshield.model.AuditLog;
import com.identityshield.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AuditLogController
 * REST Controller for accessing system audit trails:
 *  - GET /api/audit-logs
 *  - GET /api/audit-logs/case/{caseId}
 */
@RestController
@RequestMapping("/api/audit-logs")
@CrossOrigin(origins = "*")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<List<AuditLog>> getAllLogs() {
        return ResponseEntity.ok(auditLogService.getAllLogs());
    }

    @GetMapping("/case/{caseId}")
    public ResponseEntity<List<AuditLog>> getLogsByCase(@PathVariable Long caseId) {
        return ResponseEntity.ok(auditLogService.getLogsForCase(caseId));
    }
}
