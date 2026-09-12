-- ====================================================================
-- IdentityShield: AI-Based Identity & Document Screening System
-- Database Schema for MySQL 8.0+
-- ====================================================================

CREATE DATABASE IF NOT EXISTS identityshield CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE identityshield;

-- 1. Screening Cases Table
-- Represents an investigation case containing one or more submitted documents
CREATE TABLE IF NOT EXISTS screening_cases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_number VARCHAR(64) NOT NULL UNIQUE,
    case_name VARCHAR(255) NOT NULL,
    applicant_name VARCHAR(255) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, REVIEW_REQUIRED
    overall_risk_score INT DEFAULT 0,
    overall_risk_level VARCHAR(16) DEFAULT 'LOW', -- LOW, MEDIUM, HIGH
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_case_number (case_number),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Documents Table
-- Represents documents uploaded under a specific case (supports 1 to N documents)
CREATE TABLE IF NOT EXISTS documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    stored_file_path VARCHAR(512) NULL,
    document_type VARCHAR(64) NOT NULL, -- PASSPORT, NATIONAL_ID, DRIVING_LICENSE, UTILITY_BILL, BIRTH_CERTIFICATE, SUPPORTING_DOC
    file_size_bytes BIGINT DEFAULT 0,
    mime_type VARCHAR(64) DEFAULT 'image/jpeg',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_documents_case FOREIGN KEY (case_id) REFERENCES screening_cases(id) ON DELETE CASCADE,
    INDEX idx_case_id (case_id),
    INDEX idx_doc_type (document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Screening Results Table
-- Stores the ML screening outputs (CNN prediction, OpenCV metrics, OCR output, and calculated risk)
CREATE TABLE IF NOT EXISTS screening_results (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT NOT NULL,
    cnn_prediction VARCHAR(32) NOT NULL, -- Normal, Suspicious
    cnn_confidence DECIMAL(5, 4) NOT NULL, -- e.g., 0.9125 (0.0 to 1.0)
    raw_probability DECIMAL(5, 4) DEFAULT 0.5000, -- Raw Sigmoid Probability
    suspicious_probability DECIMAL(5, 4) DEFAULT 0.5000, -- P(Suspicious)
    normal_probability DECIMAL(5, 4) DEFAULT 0.5000, -- P(Normal)
    ocr_confidence DECIMAL(5, 4) DEFAULT 0.0000,
    anomaly_score DECIMAL(5, 4) DEFAULT 0.0000,
    risk_score INT NOT NULL, -- 0 to 100
    risk_level VARCHAR(16) NOT NULL, -- LOW (0-29), MEDIUM (30-59), HIGH (60-100)
    extracted_text MEDIUMTEXT NULL,
    extracted_fields_json TEXT NULL, -- JSON formatted extracted Name, DOB, Address
    image_signals_json TEXT NULL, -- JSON formatted brightness, sharpness, edge density
    consistency_notes TEXT NULL, -- Cross-document mismatch notes if any
    recommendation_message VARCHAR(512) NOT NULL DEFAULT 'Review recommended',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_results_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    INDEX idx_document_id (document_id),
    INDEX idx_risk_level (risk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Audit Logs Table
-- Records every significant operator action for regulatory compliance and audit trails
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id BIGINT NULL,
    action VARCHAR(64) NOT NULL, -- CASE_CREATED, DOCUMENT_UPLOADED, SCREENING_STARTED, SCREENING_COMPLETED, REPORT_VIEWED
    details TEXT NULL,
    operator VARCHAR(128) DEFAULT 'operator@identityshield.local',
    ip_address VARCHAR(45) DEFAULT '127.0.0.1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_case FOREIGN KEY (case_id) REFERENCES screening_cases(id) ON DELETE SET NULL,
    INDEX idx_audit_case (case_id),
    INDEX idx_audit_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====================================================================
-- Initial Seed Data for Testing and Verification
-- ====================================================================

INSERT INTO screening_cases (id, case_number, case_name, applicant_name, status, overall_risk_score, overall_risk_level)
VALUES 
(1, 'CASE-1001', 'Onboarding Verification - John Doe', 'Johnathan Doe', 'COMPLETED', 78, 'HIGH'),
(2, 'CASE-1002', 'Annual Re-KYC - Maria Santos', 'Maria Santos', 'COMPLETED', 18, 'LOW'),
(3, 'CASE-1003', 'Loan Application Identity Check - Alex Rivera', 'Alex Rivera', 'REVIEW_REQUIRED', 52, 'MEDIUM');

INSERT INTO documents (id, case_id, file_name, stored_file_path, document_type, file_size_bytes, mime_type)
VALUES
(1, 1, 'john_doe_passport.jpg', 'uploads/1_john_doe_passport.jpg', 'PASSPORT', 184520, 'image/jpeg'),
(2, 1, 'john_doe_utility_bill.jpg', 'uploads/1_john_doe_utility_bill.jpg', 'UTILITY_BILL', 234100, 'image/jpeg'),
(3, 2, 'maria_santos_national_id.jpg', 'uploads/2_maria_santos_national_id.jpg', 'NATIONAL_ID', 198400, 'image/jpeg'),
(4, 3, 'alex_rivera_driving_license.jpg', 'uploads/3_alex_rivera_driving_license.jpg', 'DRIVING_LICENSE', 156800, 'image/jpeg');

INSERT INTO screening_results (id, document_id, cnn_prediction, cnn_confidence, ocr_confidence, anomaly_score, risk_score, risk_level, extracted_text, extracted_fields_json, image_signals_json, consistency_notes, recommendation_message)
VALUES
(1, 1, 'Suspicious', 0.9100, 0.8800, 0.4200, 78, 'HIGH', 
 'PASSPORT REPUBLIC OF VERIDIA\nNAME: JOHNATHAN DOE\nDOB: 14/08/1988\nEXPIRY: 2029\nPASSPORT NO: P88291044', 
 '{"name": "JOHNATHAN DOE", "dob": "14/08/1988", "idNumber": "P88291044"}',
 '{"brightness": 128.4, "sharpness": 84.1, "edgeDensity": 0.145, "noiseAnomaly": 0.38}',
 'Identity inconsistency detected — review recommended. Date of birth (14/08/1988) does not match secondary utility bill (14/08/1989).',
 'High Risk — Further Verification Recommended'),
(2, 2, 'Normal', 0.2200, 0.7900, 0.1500, 35, 'MEDIUM',
 'VERIDIA ENERGY UTILITY BILL\nACCOUNT HOLDER: JOHN DOE\nSERVICE ADDRESS: 42 MAPLE AVE, METROPOLIS\nDOB ON FILE: 14/08/1989',
 '{"name": "JOHN DOE", "dob": "14/08/1989", "address": "42 MAPLE AVE, METROPOLIS"}',
 '{"brightness": 142.1, "sharpness": 112.5, "edgeDensity": 0.092, "noiseAnomaly": 0.12}',
 'Minor name variant (John vs Johnathan Doe) and DOB year variation with Passport.',
 'Medium Risk — Cross-document consistency review recommended'),
(3, 3, 'Normal', 0.1200, 0.9400, 0.0800, 18, 'LOW',
 'NATIONAL IDENTITY CARD\nNAME: MARIA SANTOS\nDOB: 22/03/1992\nID: NID-99201948',
 '{"name": "MARIA SANTOS", "dob": "22/03/1992", "idNumber": "NID-99201948"}',
 '{"brightness": 136.0, "sharpness": 130.4, "edgeDensity": 0.078, "noiseAnomaly": 0.05}',
 'No cross-document discrepancies detected. High optical clarity.',
 'Low Risk — Standard processing eligible'),
(4, 4, 'Normal', 0.4400, 0.7100, 0.3100, 52, 'MEDIUM',
 'STATE DRIVER LICENSE\nNAME: ALEX RIVERA\nDOB: 05/11/1985\nLIC NO: D8819033',
 '{"name": "ALEX RIVERA", "dob": "05/11/1985", "idNumber": "D8819033"}',
 '{"brightness": 110.2, "sharpness": 65.3, "edgeDensity": 0.180, "noiseAnomaly": 0.29}',
 'OpenCV detected elevated blur/low sharpness. Text extraction partially degraded.',
 'Medium Risk — Rescan or secondary supporting document suggested');

INSERT INTO audit_logs (case_id, action, details, operator)
VALUES
(1, 'CASE_CREATED', 'Case CASE-1001 created for applicant Johnathan Doe', 'operator@identityshield.local'),
(1, 'DOCUMENT_UPLOADED', 'Uploaded document john_doe_passport.jpg (PASSPORT)', 'operator@identityshield.local'),
(1, 'DOCUMENT_UPLOADED', 'Uploaded document john_doe_utility_bill.jpg (UTILITY_BILL)', 'operator@identityshield.local'),
(1, 'SCREENING_STARTED', 'Automated CNN + OCR screening initiated for CASE-1001', 'system'),
(1, 'SCREENING_COMPLETED', 'Screening completed with overall risk HIGH (78/100). Inconsistencies flagged.', 'system'),
(2, 'CASE_CREATED', 'Case CASE-1002 created for applicant Maria Santos', 'operator@identityshield.local'),
(2, 'SCREENING_COMPLETED', 'Screening completed with overall risk LOW (18/100)', 'system'),
(3, 'CASE_CREATED', 'Case CASE-1003 created for applicant Alex Rivera', 'operator@identityshield.local');
