package com.identityshield.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * AuditLog Entity
 * Tracks audit trail actions:
 *  - CASE_CREATED
 *  - DOCUMENT_UPLOADED
 *  - SCREENING_STARTED
 *  - SCREENING_COMPLETED
 *  - REPORT_VIEWED
 */
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "case_id")
    private Long caseId;

    @Column(name = "action", nullable = false, length = 64)
    private String action;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "operator", length = 128)
    private String operator = "operator@identityshield.local";

    @Column(name = "ip_address", length = 45)
    private String ipAddress = "127.0.0.1";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public AuditLog() {
    }

    public AuditLog(Long caseId, String action, String details) {
        this.caseId = caseId;
        this.action = action;
        this.details = details;
    }

    public AuditLog(Long caseId, String action, String details, String operator) {
        this.caseId = caseId;
        this.action = action;
        this.details = details;
        this.operator = operator;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCaseId() {
        return caseId;
    }

    public void setCaseId(Long caseId) {
        this.caseId = caseId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getOperator() {
        return operator;
    }

    public void setOperator(String operator) {
        this.operator = operator;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
