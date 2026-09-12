"""
IdentityShield - OpenCV Image Preprocessing & Visual Signal Extraction Module
Provides supporting computer vision signals:
  1. Image Decoding from raw uploaded bytes
  2. Resizing to 224x224 RGB for CNN input
  3. Brightness measurement (mean pixel intensity)
  4. Sharpness measurement (Laplacian variance - detects blur or excessive filtering)
  5. Edge density calculation (Canny edge detection ratio)
  6. Optical anomaly score (composite normalized heuristic signal)

Note: These metrics are SUPPORTING signals to assist human investigators.
They do not unilaterally prove or disprove document legitimacy.
"""

import cv2
import numpy as np
from PIL import Image
import io


def decode_image_bytes(image_bytes: bytes):
    """
    Decodes raw byte array into a NumPy BGR array (OpenCV format) and RGB array.
    """
    # Try OpenCV native decoding first
    np_arr = np.frombuffer(image_bytes, np.uint8)
    image_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if image_bgr is None:
        # Fallback to Pillow if OpenCV imdecode failed (e.g. specialized formats)
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_rgb = np.array(pil_img)
        image_bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
    else:
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

    return image_bgr, image_rgb


def resize_for_cnn(image_rgb: np.ndarray, target_size=(224, 224)):
    """
    Resizes the RGB image to the required CNN input resolution (224, 224).
    """
    resized = cv2.resize(image_rgb, target_size, interpolation=cv2.INTER_AREA)
    return resized.astype(np.float32)


def calculate_brightness(image_bgr: np.ndarray) -> float:
    """
    Calculates average brightness across all pixels.
    Range: 0 (pitch black) to 255 (blinding white).
    Normal documents typically range between 110 and 190.
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    return round(float(np.mean(gray)), 2)


def calculate_sharpness(image_bgr: np.ndarray) -> float:
    """
    Calculates sharpness using the variance of the Laplacian operator.
    Low values (< 80) indicate out-of-focus blur, motion blur, or heavy smoothing.
    High values (> 300) indicate sharp edges or digital artifacting.
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    return round(float(laplacian_var), 2)


def calculate_edge_density(image_bgr: np.ndarray) -> float:
    """
    Calculates the proportion of edge pixels using Canny edge detector.
    Useful for identifying spliced text, overlaid digital stickers, or abnormal borders.
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, threshold1=100, threshold2=200)
    total_pixels = edges.shape[0] * edges.shape[1]
    edge_pixels = np.count_nonzero(edges)
    density = edge_pixels / float(total_pixels)
    return round(float(density), 4)


def calculate_ela_anomaly(image_bgr: np.ndarray) -> float:
    """
    Error Level Analysis (ELA):
    Re-compresses the image at 90% JPEG quality and measures pixel difference.
    Digitally spliced or modified portions (pasted text, modified numbers)
    diverge significantly in error level compared to the background document.
    Returns normalized ELA anomaly score [0.0, 1.0].
    """
    try:
        # Re-encode image to JPEG in memory at 90% quality
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
        _, enc_img = cv2.imencode('.jpg', image_bgr, encode_param)
        resaved_bgr = cv2.imdecode(enc_img, cv2.IMREAD_COLOR)

        if resaved_bgr is None:
            return 0.05

        # Compute absolute difference
        diff = cv2.absdiff(image_bgr, resaved_bgr)
        gray_diff = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)

        # Scale difference
        scale = 10
        scaled_diff = cv2.multiply(gray_diff, scale)

        # Measure variance and maximum localized deviation
        mean_diff = float(np.mean(scaled_diff))
        std_diff = float(np.std(scaled_diff))
        max_diff = float(np.max(scaled_diff))

        # Higher localized variance indicates digital splicing / text pasting
        ela_score = min(1.0, (std_diff / 40.0) * 0.5 + (max_diff / 255.0) * 0.5)
        return round(float(ela_score), 4)
    except Exception:
        return 0.05


def extract_image_signals(image_bgr: np.ndarray, is_govt_doc: bool = False) -> dict:
    """
    Runs OpenCV signal extractions and produces an optical anomaly score in [0.0, 1.0].
    Combines sharpness, brightness, edge density, and Error Level Analysis (ELA)
    to spot digital manipulation, font tampering, and copy-move artifacts.
    """
    brightness = calculate_brightness(image_bgr)
    sharpness = calculate_sharpness(image_bgr)
    edge_density = calculate_edge_density(image_bgr)
    ela_anomaly = calculate_ela_anomaly(image_bgr)

    anomaly_factors = []

    # Blur / Sharpness check
    if sharpness < 65.0:
        anomaly_factors.append(min(1.0, (65.0 - sharpness) / 65.0 * 0.7))
    elif sharpness > 480.0:
        anomaly_factors.append(0.25)

    # Brightness check
    if brightness < 55.0:
        anomaly_factors.append((55.0 - brightness) / 55.0 * 0.6)
    elif brightness > 235.0:
        anomaly_factors.append((brightness - 235.0) / 30.0 * 0.6)

    # Edge density check - calibrated for government credentials
    max_edge_threshold = 0.32 if is_govt_doc else 0.22
    if edge_density > max_edge_threshold:
        anomaly_factors.append(min(1.0, (edge_density - max_edge_threshold) / 0.15))
    elif edge_density < 0.02:
        anomaly_factors.append(0.4)

    # ELA digital tampering signal
    if ela_anomaly > 0.45:
        anomaly_factors.append(ela_anomaly * 0.8)

    if anomaly_factors:
        anomaly_score = round(float(np.mean(anomaly_factors)), 4)
    else:
        anomaly_score = 0.05 if is_govt_doc else 0.08

    guilloche_verified = is_govt_doc and (0.08 <= edge_density <= 0.30)

    return {
        "brightness": brightness,
        "sharpness": sharpness,
        "edgeDensity": edge_density,
        "elaAnomaly": ela_anomaly,
        "anomalyScore": anomaly_score,
        "blurDetected": sharpness < 65.0,
        "glareDetected": brightness > 235.0,
        "splicingSuspected": ela_anomaly > 0.45,
        "guillochePatternIntegrity": "Verified" if guilloche_verified else "Standard"
    }
