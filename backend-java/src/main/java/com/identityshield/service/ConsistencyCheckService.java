package com.identityshield.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.identityshield.model.Document;
import com.identityshield.model.ScreeningCase;
import com.identityshield.model.ScreeningResult;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * ConsistencyCheckService
 * Cross-document consistency verification layer for multi-document cases.
 *
 * Compares extracted OCR entities (Name, Date of Birth, Address) across all
 * screened documents belonging to the same case.
 *
 * Example:
 *   Doc A: DOB = 14/08/1988
 *   Doc B: DOB = 14/08/1989
 * Result:
 *   "Identity inconsistency detected — review recommended."
 */
@Service
public class ConsistencyCheckService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public static class ConsistencyReport {
        private boolean inconsistencyDetected = false;
        private final List<String> warnings = new ArrayList<>();
        private int additionalRiskPoints = 0;

        public boolean isInconsistencyDetected() {
            return inconsistencyDetected;
        }

        public void setInconsistencyDetected(boolean inconsistencyDetected) {
            this.inconsistencyDetected = inconsistencyDetected;
        }

        public List<String> getWarnings() {
            return warnings;
        }

        public void addWarning(String warning) {
            this.warnings.add(warning);
            this.inconsistencyDetected = true;
        }

        public int getAdditionalRiskPoints() {
            return additionalRiskPoints;
        }

        public void setAdditionalRiskPoints(int additionalRiskPoints) {
            this.additionalRiskPoints = additionalRiskPoints;
        }

        public String getSummaryNote() {
            if (!inconsistencyDetected) {
                return "All common fields are consistent across uploaded documents.";
            }
            return "Identity inconsistency detected — review recommended. " + String.join("; ", warnings);
        }
    }

    /**
     * Analyzes consistency between existing documents in the case and a newly screened document.
     */
    public ConsistencyReport checkCaseConsistency(ScreeningCase screeningCase, Document newDocument, Map<String, Object> newDocFields) {
        ConsistencyReport report = new ConsistencyReport();

        if (screeningCase == null || screeningCase.getDocuments() == null || screeningCase.getDocuments().isEmpty()) {
            return report;
        }

        String newName = sanitize(getStringField(newDocFields, "name"));
        String newDob = sanitize(getStringField(newDocFields, "dob"));
        String newAddress = sanitize(getStringField(newDocFields, "address"));

        // Compare against all other documents in the case that already have screening results
        for (Document otherDoc : screeningCase.getDocuments()) {
            if (otherDoc.getId() != null && otherDoc.getId().equals(newDocument.getId())) {
                continue; // Don't compare with self
            }

            for (ScreeningResult otherResult : otherDoc.getScreeningResults()) {
                Map<String, Object> otherFields = parseFieldsJson(otherResult.getExtractedFieldsJson());
                if (otherFields.isEmpty()) continue;

                String otherName = sanitize(getStringField(otherFields, "name"));
                String otherDob = sanitize(getStringField(otherFields, "dob"));
                String otherAddress = sanitize(getStringField(otherFields, "address"));

                // 1. Date of Birth Check
                if (!newDob.isEmpty() && !otherDob.isEmpty()) {
                    if (!newDob.equalsIgnoreCase(otherDob)) {
                        report.addWarning("Date of birth mismatch: " + newDocument.getDocumentType() + " (" + newDob + ") vs " + otherDoc.getDocumentType() + " (" + otherDob + ")");
                        report.setAdditionalRiskPoints(report.getAdditionalRiskPoints() + 25);
                    }
                }

                // 2. Name Check (check if primary name tokens overlap)
                if (!newName.isEmpty() && !otherName.isEmpty()) {
                    if (!namesAreSimilar(newName, otherName)) {
                        report.addWarning("Applicant name variation: '" + newName + "' on " + newDocument.getDocumentType() + " vs '" + otherName + "' on " + otherDoc.getDocumentType());
                        report.setAdditionalRiskPoints(report.getAdditionalRiskPoints() + 15);
                    }
                }

                // 3. Address Check (informational warning if addresses diverge significantly)
                if (!newAddress.isEmpty() && !otherAddress.isEmpty()) {
                    if (!addressesAreSimilar(newAddress, otherAddress)) {
                        report.addWarning("Residential address mismatch between " + newDocument.getDocumentType() + " and " + otherDoc.getDocumentType());
                        report.setAdditionalRiskPoints(report.getAdditionalRiskPoints() + 10);
                    }
                }
            }
        }

        return report;
    }

    private boolean namesAreSimilar(String name1, String name2) {
        if (name1.equalsIgnoreCase(name2)) return true;
        // Check if one contains the other (e.g. John Doe vs Johnathan Doe)
        Set<String> words1 = new HashSet<>(Arrays.asList(name1.toUpperCase().split("\\s+")));
        Set<String> words2 = new HashSet<>(Arrays.asList(name2.toUpperCase().split("\\s+")));
        for (String w : words1) {
            if (words2.contains(w) && w.length() > 2) {
                return true; // Shares at least one significant name token
            }
        }
        return false;
    }

    private boolean addressesAreSimilar(String addr1, String addr2) {
        if (addr1.equalsIgnoreCase(addr2)) return true;
        Set<String> words1 = new HashSet<>(Arrays.asList(addr1.toUpperCase().split("[\\s,]+")));
        Set<String> words2 = new HashSet<>(Arrays.asList(addr2.toUpperCase().split("[\\s,]+")));
        int matches = 0;
        for (String w : words1) {
            if (words2.contains(w) && w.length() > 2) matches++;
        }
        return matches >= 2; // Shares at least 2 significant street/city tokens
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseFieldsJson(String json) {
        if (json == null || json.trim().isEmpty()) return Collections.emptyMap();
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    private String getStringField(Map<String, Object> fields, String key) {
        if (fields == null || !fields.containsKey(key)) return "";
        Object val = fields.get(key);
        return val != null ? val.toString().trim() : "";
    }

    private String sanitize(String input) {
        return input == null ? "" : input.trim();
    }
}
