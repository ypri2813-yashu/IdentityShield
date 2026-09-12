package com.identityshield.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * ScreeningCase Entity
 * Represents an investigation or identity screening case for an applicant.
 * Each case can contain MULTIPLE uploaded documents (e.g., Passport, Utility Bill,
 * Driving License, Supporting Proof).
 */
@Entity
@Table(name = "screening_cases")
public class ScreeningCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "case_number", nullable = false, unique = true, length = 64)
    private String caseNumber;

    @Column(name = "case_name", nullable = false)
    private String caseName;

    @Column(name = "applicant_name")
    private String applicantName;

    @Column(name = "status", nullable = false, length = 32)
    private String status = "PENDING"; // PENDING, IN_PROGRESS, COMPLETED, REVIEW_REQUIRED

    @Column(name = "overall_risk_score")
    private Integer overallRiskScore = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "overall_risk_level", length = 16)
    private RiskLevel overallRiskLevel = RiskLevel.LOW;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // A case contains one or more documents (1-to-many relationship)
    @OneToMany(mappedBy = "screeningCase", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<Document> documents = new ArrayList<>();

    public ScreeningCase() {
    }

    public ScreeningCase(String caseNumber, String caseName, String applicantName) {
        this.caseNumber = caseNumber;
        this.caseName = caseName;
        this.applicantName = applicantName;
        this.status = "PENDING";
        this.overallRiskScore = 0;
        this.overallRiskLevel = RiskLevel.LOW;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Helper to add document maintaining bidirectional link
    public void addDocument(Document document) {
        documents.add(document);
        document.setScreeningCase(this);
    }

    public void removeDocument(Document document) {
        documents.remove(document);
        document.setScreeningCase(null);
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCaseNumber() {
        return caseNumber;
    }

    public void setCaseNumber(String caseNumber) {
        this.caseNumber = caseNumber;
    }

    public String getCaseName() {
        return caseName;
    }

    public void setCaseName(String caseName) {
        this.caseName = caseName;
    }

    public String getApplicantName() {
        return applicantName;
    }

    public void setApplicantName(String applicantName) {
        this.applicantName = applicantName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getOverallRiskScore() {
        return overallRiskScore;
    }

    public void setOverallRiskScore(Integer overallRiskScore) {
        this.overallRiskScore = overallRiskScore;
    }

    public RiskLevel getOverallRiskLevel() {
        return overallRiskLevel;
    }

    public void setOverallRiskLevel(RiskLevel overallRiskLevel) {
        this.overallRiskLevel = overallRiskLevel;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<Document> getDocuments() {
        return documents;
    }

    public void setDocuments(List<Document> documents) {
        this.documents = documents;
    }
}
