# IdentityShield — AI-Based Identity & Document Screening System

> **A modern, beginner-friendly full-stack screening platform for identity and supporting document risk assessment.**

[![Java](https://img.shields.io/badge/Backend-Java%2017%20%2F%20Spring%20Boot%203-brightgreen.svg)](https://spring.io/)
[![Python](https://img.shields.io/badge/ML%20Service-Python%20%2F%20FastAPI%20%2F%20TensorFlow-blue.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2F%20Vite%20%2F%20Tailwind%20CSS-61dafb.svg)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/Database-MySQL%208.0-orange.svg)](https://www.mysql.com/)

---

## 1. Project Overview

**IdentityShield** is an AI-powered document verification and screening platform designed for compliance officers, fraud investigators, and authorized operators. It enables automated intake, CNN-based visual anomaly detection, Tesseract OCR text extraction, OpenCV optical feature extraction, multi-document consistency cross-checking, and explainable risk scoring for applicant onboarding cases.

The system is architected as a clean, decoupled 3-tier micro-pipeline:
1. **Frontend (React JSX + Tailwind)**: Dark security console with red-pink accents, responsive desktop/mobile layouts, live status badges, and interactive risk inspector.
2. **Main Backend (Java 17+ Spring Boot)**: Core business logic, MySQL persistence via Spring Data JPA, case orchestration, cross-document demographic validation, and regulatory audit logging.
3. **ML Microservice (Python FastAPI)**: Deep CNN visual classifier (TensorFlow/Keras), OpenCV optical signal extractors (sharpness, brightness, edge density), and Tesseract OCR engine.

---

## 2. Key Features

- **Multi-Document Cases**: Support for 1-to-N documents per case (e.g. Passport, National ID, Driving License, Utility Bill, Birth Certificate).
- **Sequential CNN Visual Classifier**: 224x224 RGB convolutional network predicting visual anomalies with real confidence values.
- **OpenCV Optical Signals**: Laplacian variance blur measurement, mean pixel brightness analysis, and Canny edge density ratio.
- **OCR Text & Field Extraction**: Tesseract OCR extraction with entity parsing for Name, Date of Birth, ID Numbers, and Address.
- **Cross-Document Consistency Layer**: Compares demographic fields across documents in the same case (e.g., DOB `14/08/1988` on Passport vs `14/08/1989` on Utility Bill) and highlights discrepancies with `"Identity inconsistency detected — review recommended."`
- **Explainable Risk Scoring**: Transparent formula combining CNN confidence (60%), OpenCV anomaly signals (20%), and OCR clarity (20%) into a normalized 0–100 score:
  - **0 – 29**: Low Risk (Standard processing eligible)
  - **30 – 59**: Medium Risk (Review recommended)
  - **60 – 100**: High Risk (Further verification recommended)
- **Regulatory Audit Trail**: Logs events (`CASE_CREATED`, `DOCUMENT_UPLOADED`, `SCREENING_STARTED`, `SCREENING_COMPLETED`, `REPORT_VIEWED`) with timestamps and operator identity.
- **Compliance Dashboard & Reports**: Visual case breakdowns, recent screenings table, risk distributions, and printable report summaries.

---

## 3. Technology Stack & Architecture

```text
React (Port 5173 / 3000)
       ↓
Java Spring Boot (Port 8080)
       ↓
Python FastAPI (Port 8000)
       ↓
CNN (224x224) + OpenCV + Tesseract OCR
       ↓
Java Spring Boot (Cross-Document Checks + Risk Scoring)
       ↓
MySQL Database (Port 3306)
       ↓
React UI
```

---

## 4. Folder Structure

```text
IdentityShield/
├── frontend/                     # React JSX + Vite application
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── main.jsx              # App entry point
│       ├── App.jsx               # Navigation & core view router
│       ├── api.js                # Spring Boot REST API client
│       ├── style.css             # Modern dark security UI theme
│       └── components/
│           ├── Navbar.jsx        # Header with real-time service health
│           ├── Sidebar.jsx       # Navigation drawer
│           ├── Dashboard.jsx     # Overview statistics & recent records
│           ├── NewCase.jsx       # Multi-document upload & screening
│           ├── DocumentUpload.jsx# Drag-and-drop file uploader
│           ├── ScreeningResult.jsx# Deep inspection result card
│           ├── Cases.jsx         # Searchable case registry
│           ├── Reports.jsx       # Analytics & summary report
│           └── AuditLogs.jsx     # Regulatory event logs
│
├── backend-java/                 # Java 17+ Spring Boot Main Backend
│   ├── pom.xml                   # Maven configuration
│   └── src/main/
│       ├── java/com/identityshield/
│       │   ├── IdentityShieldApplication.java
│       │   ├── config/           # CORS & RestTemplate config
│       │   ├── controller/       # Case, Document, Report, Audit, Health
│       │   ├── service/          # Business logic, ML integration, Consistency
│       │   ├── model/            # JPA entities & DTOs
│       │   ├── repository/       # Spring Data JPA repositories
│       │   └── exception/        # Global JSON error handling
│       └── resources/
│           └── application.properties # MySQL & ML service URL config
│
├── ml-service/                   # Python FastAPI ML Microservice
│   ├── main.py                   # FastAPI app with POST /screen
│   ├── cnn_model.py              # Keras Sequential CNN architecture
│   ├── preprocessing.py          # OpenCV brightness, sharpness, edge density
│   ├── ocr.py                    # Tesseract OCR & demographic parsing
│   ├── requirements.txt          # Python dependencies
│   └── model/
│       └── document_cnn.keras    # Saved trained CNN weights
│
├── training/                     # CNN Model Training & Evaluation
│   ├── train_cnn.py              # 80/20 train/val dataset training script
│   ├── evaluate_cnn.py           # Model evaluation script
│   ├── predict_cnn.py            # Single-image inference CLI
│   └── DATASET_STRUCTURE.md      # Dataset organization & PII policy
│
├── database/
│   └── schema.sql                # MySQL schema DDL & seed data
│
├── docs/
│   ├── architecture.md           # System data flow & sequence diagrams
│   ├── api.md                    # REST endpoint specifications
│   └── setup.md                  # Comprehensive local setup guide
│
├── .gitignore
└── README.md
```

---

## 5. System Requirements

- **Java Development Kit (JDK)**: Version 17 or higher
- **Apache Maven**: Version 3.8+
- **Python**: Version 3.10+
- **Node.js**: Version 18+ and `npm`
- **MySQL Server**: Version 8.0+
- *(Optional)* **Tesseract OCR**: System binary (`tesseract-ocr` on Linux, `brew install tesseract` on macOS)

---

## 6. EXACT RUNNING ORDER

Follow these steps in this exact sequence to run IdentityShield locally:

### Step 1 — MySQL Database

1. Open your terminal or MySQL Workbench:
   ```bash
   mysql -u root -p
   ```
2. Execute the schema file to create the `identityshield` database, tables, and initial seed records:
   ```sql
   SOURCE database/schema.sql;
   ```

### Step 2 — Python ML Service & CNN Training

1. Open a terminal and navigate to `ml-service/`:
   ```bash
   cd ml-service
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate    # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Train the CNN model:
   ```bash
   cd ../training
   python train_cnn.py --generate-sample-data --epochs 10
   ```
   *(Ensure `ml-service/model/document_cnn.keras` has been generated)*
5. Return to `ml-service/` and start FastAPI:
   ```bash
   cd ../ml-service
   uvicorn main:app --reload --port 8000
   ```
   FastAPI will be active at: `http://localhost:8000` (Health check: `http://localhost:8000/health`)

### Step 3 — Java Spring Boot Backend

1. Open a second terminal and navigate to `backend-java/`:
   ```bash
   cd backend-java
   ```
2. Verify database credentials in `src/main/resources/application.properties` (`spring.datasource.username` and `password`).
3. Run Spring Boot:
   ```bash
   mvn spring-boot:run
   ```
   The backend will start on: `http://localhost:8080` (API base: `http://localhost:8080/api`)

### Step 4 — React Frontend

1. Open a third terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will be active on: `http://localhost:5173` (or `http://localhost:3000`)

### Browser Access

Open your browser and navigate to:
```text
http://localhost:5173
```

---

## 7. CNN Model Architecture & Training Details

The document classification network is built using TensorFlow/Keras:

```text
Input Image (224 × 224 × 3)
      ↓
Rescaling (1.0 / 255.0)
      ↓
Conv2D (32 filters, 3×3, ReLU, padding='same')
MaxPooling2D (2×2)
      ↓
Conv2D (64 filters, 3×3, ReLU, padding='same')
MaxPooling2D (2×2)
      ↓
Conv2D (128 filters, 3×3, ReLU, padding='same')
MaxPooling2D (2×2)
      ↓
Flatten()
      ↓
Dense (128 units, ReLU)
Dropout (0.5)
      ↓
Dense (1 unit, Sigmoid)
      ↓
Output Probability P(Suspicious) in [0.0, 1.0]
```

- **Binary Labels**:
  - `0`: Normal (authentic visual patterns)
  - `1`: Suspicious (tampered or anomalous patterns)
- **Training Configuration**:
  - `80%` Training split, `20%` Validation split via `tf.keras.utils.image_dataset_from_directory()`
  - Loss: `binary_crossentropy`
  - Optimizer: `Adam(learning_rate=0.0001)`
  - Metrics: `accuracy`

---

## 8. Transparent Risk Score Formula

The total risk score (0 to 100) is calculated transparently from three complementary signals:

$$\text{Risk Score} = \text{CNN Points} (60\%) + \text{OpenCV Anomaly Points} (20\%) + \text{OCR Readability Points} (20\%) + \text{Inconsistency Penalty}$$

1. **CNN Points (Max 60 pts)**:
   - If predicted *Suspicious*: $\text{Confidence} \times 60$
   - If predicted *Normal*: $(1.0 - \text{Confidence}) \times 60$
2. **OpenCV Optical Anomaly (Max 20 pts)**:
   - Evaluates blur (Laplacian variance $< 70$), abnormal glare (luminance $> 225$), and edge density deviation.
3. **OCR Readability (Max 20 pts)**:
   - Lower OCR character confidence indicates illegibility or optical degradation: $(1.0 - \text{OCR Confidence}) \times 20$.
4. **Cross-Document Inconsistency Penalty (Add 15–25 pts)**:
   - Applied when demographic entities (DOB or Name) diverge across documents in the same case.

---

## 9. Security & Regulatory Compliance Notes

- **Authorized Operators Only**: The application is intended strictly for vetted operators and investigators.
- **Sensitive Data Handling**: Identity documents contain sensitive demographic and biometric data.
- **Do Not Commit Real PII**: Never commit identity documents, real Aadhaar cards, passport scans, or database credentials to version control.
- **Environment Variables**: In production deployments, configure database credentials and secrets via environment variables (`SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`).
- **HTTPS & Transport Security**: Always terminate TLS/HTTPS in front of the Spring Boot backend in production.
- **Audit Logging**: Every action creates an immutable database record with timestamp, operator ID, and action code.

---

## 10. Important Model Limitations & Disclaimer

> [!IMPORTANT]
> **This system is a document screening and risk-assessment prototype.**
> - A high-risk result does **not** legally prove that a document is fake or fraudulent.
> - The CNN identifies visual patterns learned from labeled training data. It does not replace forensic laboratory analysis, cryptographic chip verification, or government database validation.
> - Results must always be reviewed by an authorized human investigator before making legal or administrative decisions.
> - The UI explicitly presents: `"High Risk — Further Verification Recommended"` rather than definitive accusations of fraud.

---

## 11. Troubleshooting

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| `Model not trained` error on `/screen` | `document_cnn.keras` is missing | Run `python training/train_cnn.py --generate-sample-data` |
| `Cannot connect to backend` in React | Spring Boot is not running on port 8080 | Check terminal running `mvn spring-boot:run` |
| `Communications link failure` (MySQL) | MySQL service stopped or password mismatch | Verify MySQL status and password in `application.properties` |
| `pytesseract.TesseractNotFoundError` | Tesseract binary not in system PATH | Install Tesseract system package or check `ml-service/ocr.py` |
| CORS errors in browser | React origin not recognized | Check `CorsConfig.java` permits `http://localhost:5173` and `3000` |
