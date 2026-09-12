package com.identityshield.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Map;

/**
 * MlScreeningResponse DTO
 * Data Transfer Object mapping the JSON payload received from the Python FastAPI
 * ML service (/screen endpoint).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class MlScreeningResponse {

    private String cnnPrediction;
    private Double cnnConfidence;
    private Double rawProbability;
    private Double suspiciousProbability;
    private Double normalProbability;
    private Map<String, Object> probabilityScores;
    private Double ocrConfidence;
    private Double anomalyScore;
    private Integer riskScore;
    private String riskLevel;
    private String message;
    private String extractedText;
    private Map<String, Object> extractedFields;
    private Map<String, Object> imageSignals;

    public MlScreeningResponse() {
    }

    // Getters and Setters
    public String getCnnPrediction() {
        return cnnPrediction;
    }

    public void setCnnPrediction(String cnnPrediction) {
        this.cnnPrediction = cnnPrediction;
    }

    public Double getCnnConfidence() {
        return cnnConfidence;
    }

    public void setCnnConfidence(Double cnnConfidence) {
        this.cnnConfidence = cnnConfidence;
    }

    public Double getRawProbability() {
        return rawProbability;
    }

    public void setRawProbability(Double rawProbability) {
        this.rawProbability = rawProbability;
    }

    public Double getSuspiciousProbability() {
        return suspiciousProbability;
    }

    public void setSuspiciousProbability(Double suspiciousProbability) {
        this.suspiciousProbability = suspiciousProbability;
    }

    public Double getNormalProbability() {
        return normalProbability;
    }

    public void setNormalProbability(Double normalProbability) {
        this.normalProbability = normalProbability;
    }

    public Map<String, Object> getProbabilityScores() {
        return probabilityScores;
    }

    public void setProbabilityScores(Map<String, Object> probabilityScores) {
        this.probabilityScores = probabilityScores;
    }

    public Double getOcrConfidence() {
        return ocrConfidence;
    }

    public void setOcrConfidence(Double ocrConfidence) {
        this.ocrConfidence = ocrConfidence;
    }

    public Double getAnomalyScore() {
        return anomalyScore;
    }

    public void setAnomalyScore(Double anomalyScore) {
        this.anomalyScore = anomalyScore;
    }

    public Integer getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Integer riskScore) {
        this.riskScore = riskScore;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getExtractedText() {
        return extractedText;
    }

    public void setExtractedText(String extractedText) {
        this.extractedText = extractedText;
    }

    public Map<String, Object> getExtractedFields() {
        return extractedFields;
    }

    public void setExtractedFields(Map<String, Object> extractedFields) {
        this.extractedFields = extractedFields;
    }

    public Map<String, Object> getImageSignals() {
        return imageSignals;
    }

    public void setImageSignals(Map<String, Object> imageSignals) {
        this.imageSignals = imageSignals;
    }
}
