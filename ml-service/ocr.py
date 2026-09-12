"""
IdentityShield - Optical Character Recognition (OCR) Module
Utilizes Tesseract OCR (via pytesseract) to extract raw text and confidence metrics.
Parses basic demographic entities (Name, Date of Birth, ID Numbers, Address) to feed
the cross-document consistency comparison layer.
"""

import re
import numpy as np

# Safe import for pytesseract
try:
    import pytesseract
    from pytesseract import Output
    PYTESSERACT_AVAILABLE = True
except ImportError:
    PYTESSERACT_AVAILABLE = False


def extract_document_text(image_rgb: np.ndarray) -> dict:
    """
    Extracts text and average character confidence using Tesseract OCR.
    If Tesseract binary is not installed, gracefully returns an informational message
    without crashing the service.
    """
    if not PYTESSERACT_AVAILABLE:
        return {
            "ocrText": "Tesseract library (pytesseract) is not installed in the Python environment.",
            "ocrConfidence": 0.0,
            "textDetected": False,
            "extractedFields": {}
        }

    try:
        # Extract full text
        extracted_text = pytesseract.image_to_string(image_rgb, lang='eng').strip()

        # Extract detailed word data with confidence
        data = pytesseract.image_to_data(image_rgb, output_type=Output.DICT)
        confidences = []
        for conf in data.get('conf', []):
            try:
                c = float(conf)
                if c > 0:  # -1 is returned for spaces/structure
                    confidences.append(c / 100.0)
            except (ValueError, TypeError):
                continue

        avg_confidence = round(float(np.mean(confidences)), 4) if confidences else 0.0
        text_detected = len(extracted_text) > 10

        # Parse key entities using simple regex patterns
        extracted_fields = parse_identity_fields(extracted_text)

        return {
            "ocrText": extracted_text if extracted_text else "No legible text detected by OCR engine.",
            "ocrConfidence": avg_confidence,
            "textDetected": text_detected,
            "extractedFields": extracted_fields
        }

    except Exception as e:
        # Common issue: tesseract-ocr system binary not installed on Linux/Windows host
        return {
            "ocrText": f"OCR processing unavailable: {str(e)}. Please ensure 'tesseract' binary is installed.",
            "ocrConfidence": 0.0,
            "textDetected": False,
            "extractedFields": {}
        }


def parse_identity_fields(text: str) -> dict:
    """
    Simple regex-based entity extractor for common identity document fields.
    Extracts Name, Date of Birth (DOB), ID/Passport/License Number, and Address fragments.
    """
    fields = {}

    if not text:
        return fields

    # 1. Date of Birth extraction (supports DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD.MM.YYYY)
    dob_match = re.search(r'(?:DOB|Birth|D\.O\.B|Born)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text, re.IGNORECASE)
    if not dob_match:
        dob_match = re.search(r'\b(\d{2}[/-]\d{2}[/-]\d{4})\b', text)
    if dob_match:
        fields["dob"] = dob_match.group(1).strip()

    # 2. Name extraction (e.g. NAME: John Doe, or Given Names)
    name_match = re.search(r'(?:NAME|HOLDER|GIVEN NAMES|SURNAME)[:\s]*([A-Z\s]{3,30})', text, re.IGNORECASE)
    if name_match:
        clean_name = re.sub(r'\s+', ' ', name_match.group(1)).strip()
        if len(clean_name) > 2:
            fields["name"] = clean_name

    # 3. ID / Passport / License Number
    id_match = re.search(r'(?:ID|LIC|PASS|NO|NUMBER)[:\s#]*([A-Z0-9-]{6,15})', text, re.IGNORECASE)
    if id_match:
        fields["idNumber"] = id_match.group(1).strip()

    # 4. Address detection
    addr_match = re.search(r'(?:ADDRESS|ADDR|STREET)[:\s]*([A-Za-z0-9\s,\.-]{10,60})', text, re.IGNORECASE)
    if addr_match:
        fields["address"] = addr_match.group(1).strip()

    return fields
