package com.identityshield.service;

import com.identityshield.model.AuditLog;
import com.identityshield.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * AuditLogService
 * Handles regulatory audit logging for all critical operator actions:
 *  - CASE_CREATED
 *  - DOCUMENT_UPLOADED
 *  - SCREENING_STARTED
 *  - SCREENING_COMPLETED
 *  - REPORT_VIEWED
 */
@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public AuditLog logAction(Long caseId, String action, String details) {
        AuditLog log = new AuditLog(caseId, action, details);
        return auditLogRepository.save(log);
    }

    @Transactional
    public AuditLog logAction(Long caseId, String action, String details, String operator) {
        AuditLog log = new AuditLog(caseId, action, details, operator);
        return auditLogRepository.save(log);
    }

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<AuditLog> getLogsForCase(Long caseId) {
        return auditLogRepository.findByCaseIdOrderByCreatedAtDesc(caseId);
    }
}
