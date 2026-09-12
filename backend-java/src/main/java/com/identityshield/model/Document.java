package com.identityshield.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Document Entity
 * Represents an uploaded identity or supporting document belonging to a case.
 */
@Entity
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    @JsonBackReference
    private ScreeningCase screeningCase;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "stored_file_path")
    private String storedFilePath;

    @Column(name = "document_type", nullable = false, length = 64)
    private String documentType; // PASSPORT, NATIONAL_ID, DRIVING_LICENSE, UTILITY_BILL, BIRTH_CERTIFICATE, SUPPORTING_DOC

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "mime_type", length = 64)
    private String mimeType;

    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;

    // Document -> screening result(s)
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<ScreeningResult> screeningResults = new ArrayList<>();

    public Document() {
    }

    public Document(String fileName, String documentType, Long fileSizeBytes, String mimeType) {
        this.fileName = fileName;
        this.documentType = documentType;
        this.fileSizeBytes = fileSizeBytes;
        this.mimeType = mimeType;
    }

    @PrePersist
    protected void onCreate() {
        this.uploadedAt = LocalDateTime.now();
    }

    public void addScreeningResult(ScreeningResult result) {
        screeningResults.add(result);
        result.setDocument(this);
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ScreeningCase getScreeningCase() {
        return screeningCase;
    }

    public void setScreeningCase(ScreeningCase screeningCase) {
        this.screeningCase = screeningCase;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getStoredFilePath() {
        return storedFilePath;
    }

    public void setStoredFilePath(String storedFilePath) {
        this.storedFilePath = storedFilePath;
    }

    public String getDocumentType() {
        return documentType;
    }

    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }

    public Long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public void setFileSizeBytes(Long fileSizeBytes) {
        this.fileSizeBytes = fileSizeBytes;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public List<ScreeningResult> getScreeningResults() {
        return screeningResults;
    }

    public void setScreeningResults(List<ScreeningResult> screeningResults) {
        this.screeningResults = screeningResults;
    }
}
