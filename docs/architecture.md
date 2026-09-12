# IdentityShield — System Architecture & Data Flow

This document details the architectural blueprint, communications, component responsibilities, and data flow of **IdentityShield — AI-Based Identity & Document Screening System**.

---

## 1. High-Level System Architecture

```text
+-------------------------------------------------------------+
|                      React.js Frontend                      |
|            (Dark Theme / Red-Pink Accent / Modern UI)       |
|                  Port: 5173 (or Vite dev 3000)              |
+------------------------------+------------------------------+
                               |
                        HTTP REST / JSON
                               |
                               v
+-------------------------------------------------------------+
|             Main Backend: Java 17+ Spring Boot              |
|        (Case Management, Orchestration, Consistency, Audit) |
|                         Port: 8080                          |
+---------------+------------------------------+--------------+
                |                              |
      HTTP multipart/form-data                 | Spring Data JPA / JDBC
                |                              |
                v                              v
+-------------------------------+   +-------------------------+
|   ML Service: Python FastAPI  |   |     MySQL Database      |
|    (CNN + OpenCV + OCR)       |   |      (identityshield)   |
|          Port: 8000           |   |       Port: 3306        |
+---------------+---------------+   +-------------------------+
                |
     +----------+----------+
     |          |          |
     v          v          v
+---------+ +--------+ +----------+
|   CNN   | | OpenCV | |Tesseract |
| 224x224 | |Signals | |   OCR    |
+---------+ +--------+ +----------+
```

---

## 2. End-to-End Execution Sequence

1. **Case Creation**:
   - The operator creates a case in React (`POST /api/cases`) with a case name and applicant name.
   - Spring Boot persists the case in MySQL and logs `CASE_CREATED`.

2. **Document Upload**:
   - The operator attaches one or more identity or supporting documents (Passport, National ID, Driving License, Utility Bill, etc.).
   - React sends multipart files to Spring Boot (`POST /api/cases/{caseId}/documents`).
   - Spring Boot saves the physical files to `./uploads`, creates `documents` records in MySQL, and logs `DOCUMENT_UPLOADED`.

3. **Screening Initiation**:
   - The operator initiates screening for a document or batch (`POST /api/documents/{documentId}/screen`).
   - Spring Boot streams the image bytes to Python FastAPI (`POST http://localhost:8000/screen`).

4. **Python ML Processing**:
   - **Image Preprocessing**: OpenCV decodes, converts to RGB, and resizes to `224 × 224`.
   - **CNN Visual Classifier**: Rescaled `[0, 1]` tensor feeds into the Sequential CNN (Conv2D -> MaxPool -> Conv2D -> MaxPool -> Conv2D -> MaxPool -> Flatten -> Dense -> Dropout -> Dense Sigmoid) to output `Normal` vs `Suspicious` visual prediction and confidence.
   - **OpenCV Optical Signals**: Laplacian variance determines sharpness (detecting blur or digital re-rendering); Canny edge density flags abnormal splicing or noise; mean luminance measures brightness.
   - **Tesseract OCR**: Extracts text strings, character confidence, and parses demographic entities (Name, Date of Birth, ID Numbers, Address).
   - Python packages results into JSON and returns to Spring Boot.

5. **Cross-Document Consistency & Final Risk Scoring**:
   - Spring Boot inspects other documents already screened in the same case.
   - Compares Date of Birth, Names, and Addresses. If a conflict is found (e.g. DOB `14/08/1988` vs `14/08/1989`), an inconsistency warning is added and risk points are adjusted.
   - Risk score `[0 - 100]` is mapped to:
     - `0 – 29`: **LOW** (Standard processing eligible)
     - `30 – 59`: **MEDIUM** (Review recommended)
     - `60 – 100`: **HIGH** (Further verification recommended)

6. **Persistence & Presentation**:
   - Spring Boot saves the screening result in MySQL `screening_results`, recalculates overall case risk, and writes `SCREENING_COMPLETED` audit log.
   - React updates the UI, rendering the high-contrast result card and consistency alerts.

---

## 3. Database Entity Relationship (ER)

```text
+---------------------+
|   screening_cases   |
|---------------------|
| id (PK)             |
| case_number (UK)    |<-------+
| case_name           |        |
| applicant_name      |        | 1:N
| status              |        |
| overall_risk_score  |        |
| overall_risk_level  |        |
| created_at          |        |
+---------------------+        |
          | 1                  |
          |                    |
          | N                  |
          v                    |
+---------------------+        |
|      documents      |        |
|---------------------|        |
| id (PK)             |        |
| case_id (FK)        |        |
| file_name           |        |
| stored_file_path    |        |
| document_type       |        |
| file_size_bytes     |        |
| uploaded_at         |        |
+---------------------+        |
          | 1                  |
          |                    |
          | N                  |
          v                    |
+---------------------+   +----+----------------+
|  screening_results  |   |     audit_logs      |
|---------------------|   |---------------------|
| id (PK)             |   | id (PK)             |
| document_id (FK)    |   | case_id (FK)        |
| cnn_prediction      |   | action              |
| cnn_confidence      |   | details             |
| ocr_confidence      |   | operator            |
| anomaly_score       |   | created_at          |
| risk_score          |   +---------------------+
| risk_level          |
| extracted_text      |
| image_signals_json  |
| consistency_notes   |
| recommendation_msg  |
+---------------------+
```
