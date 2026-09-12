"""
IdentityShield - Python FastAPI Machine Learning Microservice
Exposes:
  POST /screen - Accepts document image file via multipart/form-data
                 Runs CNN inference + OpenCV signals + Tesseract OCR
                 Computes unified risk score (0-100)
  GET  /health - Health check and CNN model availability status
"""

import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from cnn_model import load_screening_model, predict_document_image, MODEL_SAVE_PATH
from preprocessing import decode_image_bytes, resize_for_cnn, extract_image_signals
from ocr import extract_document_text

app = FastAPI(
    title="IdentityShield ML Service",
    description="CNN Document Visual Classifier, OpenCV Preprocessor & Tesseract OCR Service",
    version="1.0.0"
)

# Enable CORS for local development (Spring Boot & React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attempt to load model at startup
_model = None
_model_error = None


def get_model():
    """Lazily loads and caches the CNN model."""
    global _model, _model_error
    if _model is None:
        _model, _model_error = load_screening_model(MODEL_SAVE_PATH)
    return _model, _model_error


def calculate_risk_score(cnn_prediction: str, cnn_confidence: float, anomaly_score: float, ocr_confidence: float) -> tuple[int, str, str]:
    """
    Transparent risk score calculation combining CNN (main signal),
    OpenCV optical anomaly (supporting), and OCR readability (supporting).

    Weights:
      - CNN visual prediction: 60%
      - OpenCV optical anomaly: 20%
      - OCR readability / confidence: 20%

    Returns:
      (risk_score: int in [0, 100], risk_level: "Low"|"Medium"|"High", message: str)
    """
    # 1. Base score from CNN prediction
    # If CNN flags "Suspicious", score scales directly with confidence (up to 60 points)
    # If CNN flags "Normal", score is inverted (1.0 - confidence) * 60 points
    if cnn_prediction == "Suspicious":
        cnn_points = cnn_confidence * 60.0
    else:
        cnn_points = (1.0 - cnn_confidence) * 60.0

    # 2. OpenCV anomaly contribution (up to 20 points)
    # anomaly_score is in [0.0, 1.0]
    opencv_points = min(20.0, anomaly_score * 20.0)

    # 3. OCR contribution (up to 20 points)
    # Lower OCR confidence or unreadable text suggests degraded/tampered document
    # If ocr_confidence is low (e.g. 0.3), points added = (1.0 - 0.3) * 20 = 14 points
    if ocr_confidence > 0:
        ocr_points = (1.0 - ocr_confidence) * 20.0
    else:
        ocr_points = 10.0  # Moderate default when text is unverified

    # Composite score clamped to [0, 100]
    total_score = int(round(cnn_points + opencv_points + ocr_points))
    total_score = max(0, min(100, total_score))

    # Threshold classification
    # 0–29: Low
    # 30–59: Medium
    # 60–100: High
    if total_score >= 60:
        risk_level = "High"
        message = "High Risk — Further verification recommended"
    elif total_score >= 30:
        risk_level = "Medium"
        message = "Medium Risk — Review recommended"
    else:
        risk_level = "Low"
        message = "Low Risk — Standard processing eligible"

    return total_score, risk_level, message


@app.get("/health")
def health_check():
    """Returns service health and whether the CNN model is ready."""
    model, error = get_model()
    return {
        "status": "UP",
        "service": "IdentityShield ML Service",
        "modelLoaded": model is not None,
        "modelPath": MODEL_SAVE_PATH,
        "modelStatus": "Ready" if model is not None else (error or "Model not loaded")
    }


@app.post("/screen")
async def screen_document(file: UploadFile = File(...)):
    """
    Main document screening endpoint:
      1. Receives image upload
      2. Decodes image bytes
      3. Verifies CNN model exists (returns 400 with clear message if not trained)
      4. Feeds 224x224 normalized image to CNN
      5. Runs OpenCV image checks (brightness, sharpness, edge density, anomaly)
      6. Runs Tesseract OCR for text & field extraction
      7. Computes risk score (0-100) and risk level (Low, Medium, High)
      8. Returns comprehensive JSON response
    """
    # Verify file is provided
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    # 1. Read file bytes
    try:
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    # 2. Decode image using OpenCV / Pillow
    try:
        image_bgr, image_rgb = decode_image_bytes(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted image format: {str(e)}")

    # 3. Check model availability
    model, error = get_model()
    if model is None:
        # Prompt requirement: If model does not exist, return a clear error
        # Do not silently generate fake predictions.
        return JSONResponse(
            status_code=400,
            content={
                "error": "Model not trained",
                "message": f"{error} Please run: python training/train_cnn.py to generate the trained model."
            }
        )

    # 4. Prepare image for CNN (224x224)
    cnn_input = resize_for_cnn(image_rgb, target_size=(224, 224))

    # 5. Run CNN visual classification
    try:
        cnn_prediction, cnn_confidence, raw_prob = predict_document_image(model, cnn_input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CNN inference failure: {str(e)}")

    # 6. Run OpenCV image signals
    try:
        image_signals = extract_image_signals(image_bgr)
    except Exception as e:
        image_signals = {
            "brightness": 128.0,
            "sharpness": 100.0,
            "edgeDensity": 0.1,
            "anomalyScore": 0.2
        }

    # 7. Run Tesseract OCR
    ocr_result = extract_document_text(image_rgb)

    # 8. Compute composite risk score
    risk_score, risk_level, recommendation_message = calculate_risk_score(
        cnn_prediction=cnn_prediction,
        cnn_confidence=cnn_confidence,
        anomaly_score=image_signals.get("anomalyScore", 0.1),
        ocr_confidence=ocr_result.get("ocrConfidence", 0.0)
    )

    suspicious_prob = round(raw_prob, 4)
    normal_prob = round(1.0 - raw_prob, 4)

    return {
        "cnnPrediction": cnn_prediction,
        "cnnConfidence": cnn_confidence,
        "rawProbability": suspicious_prob,
        "suspiciousProbability": suspicious_prob,
        "normalProbability": normal_prob,
        "ocrConfidence": ocr_result.get("ocrConfidence", 0.0),
        "anomalyScore": image_signals.get("anomalyScore", 0.0),
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "message": recommendation_message,
        "probabilityScores": {
            "suspiciousProbability": suspicious_prob,
            "normalProbability": normal_prob,
            "anomalyProbability": round(image_signals.get("anomalyScore", 0.0), 4),
            "ocrConfidenceProbability": round(ocr_result.get("ocrConfidence", 0.0), 4),
            "overallRiskProbability": round(risk_score / 100.0, 4),
            "rawSigmoidScore": suspicious_prob
        },
        "extractedText": ocr_result.get("ocrText", ""),
        "extractedFields": ocr_result.get("extractedFields", {}),
        "imageSignals": {
            "brightness": image_signals.get("brightness"),
            "sharpness": image_signals.get("sharpness"),
            "edgeDensity": image_signals.get("edgeDensity"),
            "blurDetected": image_signals.get("blurDetected", False),
            "glareDetected": image_signals.get("glareDetected", False)
        }
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
