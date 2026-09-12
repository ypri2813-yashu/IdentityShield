package com.identityshield.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * ScreeningResult Entity
 * Stores the deep screening outputs for a specific document:
 *  - CNN visual prediction & confidence
 *  - OpenCV optical anomaly metrics
 *  - Tesseract OCR confidence & extracted text
 *  - Cross-document consistency notes
 *  - Calculated risk score (0-100) & risk level (LOW/MEDIUM/HIGH)
 */
@Entity
@Table(name = "screening_results")
public class ScreeningResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    @JsonBackReference
    private Document document;

    @Column(name = "cnn_prediction", nullable = false, length = 32)
    private String cnnPrediction; // "Normal" or "Suspicious"

    @Column(name = "cnn_confidence", nullable = false, precision = 5, scale = 4)
    private BigDecimal cnnConfidence; // e.g. 0.9100

    @Column(name = "raw_probability", precision = 5, scale = 4)
    private BigDecimal rawProbability; // e.g. 0.9124

    @Column(name = "suspicious_probability", precision = 5, scale = 4)
    private BigDecimal suspiciousProbability; // e.g. 0.9124

    @Column(name = "normal_probability", precision = 5, scale = 4)
    private BigDecimal normalProbability; // e.g. 0.0876

    @Column(name = "ocr_confidence", precision = 5, scale = 4)
    private BigDecimal ocrConfidence; // e.g. 0.8800

    @Column(name = "anomaly_score", precision = 5, scale = 4)
    private BigDecimal anomalyScore; // e.g. 0.4200

    @Column(name = "risk_score", nullable = false)
    private Integer riskScore; // 0 - 100

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 16)
    private RiskLevel riskLevel; // LOW, MEDIUM, HIGH

    @Lob
    @Column(name = "extracted_text", columnDefinition = "MEDIUMTEXT")
    private String extractedText;

    @Column(name = "extracted_fields_json", columnDefinition = "TEXT")
    private String extractedFieldsJson;

    @Column(name = "image_signals_json", columnDefinition = "TEXT")
    private String imageSignalsJson;

    @Column(name = "consistency_notes", columnDefinition = "TEXT")
    private String consistencyNotes;

    @Column(name = "recommendation_message", length = 512)
    private String recommendationMessage;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public ScreeningResult() {
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

    public Document getDocument() {
        return document;
    }

    public void setDocument(Document document) {
        this.document = document;
    }

    public String getCnnPrediction() {
        return cnnPrediction;
    }

    public void setCnnPrediction(String cnnPrediction) {
        this.cnnPrediction = cnnPrediction;
    }

    public BigDecimal getCnnConfidence() {
        return cnnConfidence;
    }

    public void setCnnConfidence(BigDecimal cnnConfidence) {
        this.cnnConfidence = cnnConfidence;
    }

    public BigDecimal getRawProbability() {
        return rawProbability;
    }

    public void setRawProbability(BigDecimal rawProbability) {
        this.rawProbability = rawProbability;
    }

    public BigDecimal getSuspiciousProbability() {
        return suspiciousProbability;
    }

    public void setSuspiciousProbability(BigDecimal suspiciousProbability) {
        this.suspiciousProbability = suspiciousProbability;
    }

    public BigDecimal getNormalProbability() {
        return normalProbability;
    }

    public void setNormalProbability(BigDecimal normalProbability) {
        this.normalProbability = normalProbability;
    }

    public BigDecimal getOcrConfidence() {
        return ocrConfidence;
    }

    public void setOcrConfidence(BigDecimal ocrConfidence) {
        this.ocrConfidence = ocrConfidence;
    }

    public BigDecimal getAnomalyScore() {
        return anomalyScore;
    }

    public void setAnomalyScore(BigDecimal anomalyScore) {
        this.anomalyScore = anomalyScore;
    }

    public Integer getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Integer riskScore) {
        this.riskScore = riskScore;
    }

    public RiskLevel getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(RiskLevel riskLevel) {
        this.riskLevel = riskLevel;
    }

    public String getExtractedText() {
        return extractedText;
    }

    public void setExtractedText(String extractedText) {
        this.extractedText = extractedText;
    }

    public String getExtractedFieldsJson() {
        return extractedFieldsJson;
    }

    public void setExtractedFieldsJson(String extractedFieldsJson) {
        this.extractedFieldsJson = extractedFieldsJson;
    }

    public String getImageSignalsJson() {
        return imageSignalsJson;
    }

    public void setImageSignalsJson(String imageSignalsJson) {
        this.imageSignalsJson = imageSignalsJson;
    }

    public String getConsistencyNotes() {
        return consistencyNotes;
    }

    public void setConsistencyNotes(String consistencyNotes) {
        this.consistencyNotes = consistencyNotes;
    }

    public String getRecommendationMessage() {
        return recommendationMessage;
    }

    public void setRecommendationMessage(String recommendationMessage) {
        this.recommendationMessage = recommendationMessage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
