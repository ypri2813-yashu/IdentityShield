# IdentityShield — Setup & Installation Guide

This guide provides end-to-end instructions for running the complete IdentityShield stack on your local machine.

---

## Prerequisites

Ensure the following tools are installed:
1. **Java JDK 17+** (OpenJDK, Temurin, or Oracle JDK)
2. **Apache Maven 3.8+** (or use the Maven wrapper)
3. **Python 3.10+**
4. **Node.js 18+** & `npm`
5. **MySQL Server 8.0+**
6. *(Optional)* **Tesseract OCR**:
   - Ubuntu/Debian: `sudo apt-get install -y tesseract-ocr`
   - macOS: `brew install tesseract`
   - Windows: Download from GitHub UB-Mannheim Tesseract installer

---

## Step 1: MySQL Database Setup

1. Start your local MySQL server.
2. Log into MySQL client:
   ```bash
   mysql -u root -p
   ```
3. Execute the provided schema script:
   ```sql
   SOURCE database/schema.sql;
   ```
   *(Or run: `mysql -u root -p < database/schema.sql` from your terminal)*
4. Verify the database and tables:
   ```sql
   USE identityshield;
   SHOW TABLES;
   ```
   You should see:
   - `screening_cases`
   - `documents`
   - `screening_results`
   - `audit_logs`

---

## Step 2: Python ML Service & CNN Training

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
4. Train the CNN Model:
   ```bash
   cd ../training
   python train_cnn.py --generate-sample-data --epochs 10
   ```
   *(The `--generate-sample-data` flag automatically creates a verified sample dataset so you can train the CNN immediately without downloading gigabytes of external data)*
5. Confirm the trained model file exists:
   ```bash
   ls -la ../ml-service/model/document_cnn.keras
   ```
6. Start the Python FastAPI ML microservice:
   ```bash
   cd ../ml-service
   uvicorn main:app --reload --port 8000
   ```
   Verify by opening: `http://localhost:8000/health` in your browser.

---

## Step 3: Java Spring Boot Backend

1. Open a new terminal and navigate to `backend-java/`:
   ```bash
   cd backend-java
   ```
2. Check `src/main/resources/application.properties` to ensure MySQL username and password match your environment:
   ```properties
   spring.datasource.username=root
   spring.datasource.password=root
   ```
3. Build and launch Spring Boot:
   ```bash
   mvn spring-boot:run
   ```
4. The backend starts on **port 8080**.
   Test the health endpoint: `http://localhost:8080/api/health`

---

## Step 4: React Frontend

1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser to:
   ```text
   http://localhost:5173
   ```
   *(Or port 3000 if running in container)*

You will see the dark-themed IdentityShield investigation dashboard!
