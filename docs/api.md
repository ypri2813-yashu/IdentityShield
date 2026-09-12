# IdentityShield — REST API Documentation

Base URL: `http://localhost:8080/api`

All responses return standard JSON. Errors use appropriate HTTP status codes without exposing raw stack traces.

---

## 1. Case Management APIs

### `POST /api/cases`
Creates a new screening case for an applicant.

**Request Body:**
```json
{
  "caseName": "Onboarding Verification - John Doe",
  "applicantName": "Johnathan Doe"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "caseNumber": "CASE-1001",
  "caseName": "Onboarding Verification - John Doe",
  "applicantName": "Johnathan Doe",
  "status": "PENDING",
  "overallRiskScore": 0,
  "overallRiskLevel": "LOW",
  "createdAt": "2026-09-11T22:30:00",
  "updatedAt": "2026-09-11T22:30:00",
  "documents": []
}
```

---

### `GET /api/cases`
Returns a list of all screening cases sorted by creation date descending.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "caseNumber": "CASE-1001",
    "caseName": "Onboarding Verification - John Doe",
    "applicantName": "Johnathan Doe",
    "status": "COMPLETED",
    "overallRiskScore": 78,
    "overallRiskLevel": "HIGH",
    "createdAt": "2026-09-11T22:30:00"
  }
]
```

---

### `GET /api/cases/{id}`
Returns full details of a specific case, including all uploaded documents and their screening results.

**Response (200 OK):**
```json
{
  "id": 1,
  "caseNumber": "CASE-1001",
  "caseName": "Onboarding Verification - John Doe",
  "applicantName": "Johnathan Doe",
  "status": "REVIEW_REQUIRED",
  "overallRiskScore": 78,
  "overallRiskLevel": "HIGH",
  "documents": [
    {
      "id": 1,
      "fileName": "john_doe_passport.jpg",
      "documentType": "PASSPORT",
      "fileSizeBytes": 184520,
      "screeningResults": [
        {
          "id": 1,
          "cnnPrediction": "Suspicious",
          "cnnConfidence": 0.9100,
          "ocrConfidence": 0.8800,
          "anomalyScore": 0.4200,
          "riskScore": 78,
          "riskLevel": "HIGH",
          "recommendationMessage": "High Risk — Further Verification Recommended"
        }
      ]
    }
  ]
}
```

---

### `POST /api/cases/{caseId}/documents`
Uploads a document image to a case.

**Content-Type:** `multipart/form-data`
**Parameters:**
- `file`: Document image file (JPEG, PNG, WebP)
- `documentType`: (Optional, default: `SUPPORTING_DOC`) e.g. `PASSPORT`, `NATIONAL_ID`, `DRIVING_LICENSE`, `UTILITY_BILL`, `BIRTH_CERTIFICATE`.

**Response (201 Created):**
```json
{
  "id": 2,
  "fileName": "john_doe_utility_bill.jpg",
  "documentType": "UTILITY_BILL",
  "fileSizeBytes": 234100,
  "mimeType": "image/jpeg",
  "uploadedAt": "2026-09-11T22:32:00"
}
```

---

## 2. Document Screening APIs

### `POST /api/documents/{documentId}/screen`
Triggers the multi-step screening pipeline for an uploaded document:
1. Streams image to Python FastAPI (`POST http://localhost:8000/screen`)
2. Receives CNN prediction, OpenCV signals, and Tesseract OCR text
3. Performs cross-document consistency checks
4. Stores `screening_results` record in MySQL
5. Updates overall case risk and creates audit logs.

**Response (200 OK):**
```json
{
  "id": 1,
  "cnnPrediction": "Suspicious",
  "cnnConfidence": 0.9100,
  "ocrConfidence": 0.8800,
  "anomalyScore": 0.4200,
  "riskScore": 78,
  "riskLevel": "HIGH",
  "recommendationMessage": "High Risk — Further Verification Recommended",
  "extractedText": "PASSPORT REPUBLIC OF VERIDIA\nNAME: JOHNATHAN DOE\nDOB: 14/08/1988...",
  "consistencyNotes": "Identity inconsistency detected — review recommended. Date of birth (14/08/1988) does not match secondary utility bill (14/08/1989).",
  "createdAt": "2026-09-11T22:35:00"
}
```

---

## 3. Python ML Service Direct API

### `POST http://localhost:8000/screen`
Direct FastAPI microservice endpoint.

**Content-Type:** `multipart/form-data`
**Parameters:**
- `file`: Image binary

**Response (200 OK):**
```json
{
  "cnnPrediction": "Suspicious",
  "cnnConfidence": 0.91,
  "ocrConfidence": 0.88,
  "anomalyScore": 0.42,
  "riskScore": 78,
  "riskLevel": "High",
  "message": "Further verification recommended",
  "extractedText": "...",
  "extractedFields": {
    "name": "JOHNATHAN DOE",
    "dob": "14/08/1988",
    "idNumber": "P88291044"
  },
  "imageSignals": {
    "brightness": 128.4,
    "sharpness": 84.1,
    "edgeDensity": 0.145,
    "blurDetected": false,
    "glareDetected": false
  }
}
```

**If model is missing (400 Bad Request):**
```json
{
  "error": "Model not trained",
  "message": "Model not trained. Run train_cnn.py first to generate '.../document_cnn.keras'."
}
```

---

## 4. Reports & Audit APIs

### `GET /api/reports`
Returns high-level statistics across all cases and screenings:
- `totalDocumentsScreened`
- `lowRiskCount`, `mediumRiskCount`, `highRiskCount`
- Percentage breakdowns
- Recent results for rapid inspection

### `GET /api/audit-logs`
Returns chronological audit events:
- `CASE_CREATED`
- `DOCUMENT_UPLOADED`
- `SCREENING_STARTED`
- `SCREENING_COMPLETED`
- `REPORT_VIEWED`
