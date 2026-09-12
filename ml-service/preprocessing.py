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


def extract_image_signals(image_bgr: np.ndarray) -> dict:
    """
    Runs all OpenCV signal extractions and produces an optical anomaly score in [0.0, 1.0].
    """
    brightness = calculate_brightness(image_bgr)
    sharpness = calculate_sharpness(image_bgr)
    edge_density = calculate_edge_density(image_bgr)

    # Anomaly indicator heuristic:
    # 1. Severe blur (sharpness < 70) or artificial sharpening (> 450)
    # 2. Extreme brightness (underexposed < 60 or overexposed > 225)
    # 3. Very low edge density (< 0.02, blank document) or very high (> 0.25, noisy/altered)
    anomaly_factors = []

    # Blur / Sharpness check
    if sharpness < 70.0:
        anomaly_factors.append(min(1.0, (70.0 - sharpness) / 70.0 * 0.7))
    elif sharpness > 450.0:
        anomaly_factors.append(0.3)

    # Brightness check
    if brightness < 60.0:
        anomaly_factors.append((60.0 - brightness) / 60.0 * 0.6)
    elif brightness > 225.0:
        anomaly_factors.append((brightness - 225.0) / 30.0 * 0.6)

    # Edge density check
    if edge_density > 0.22:
        anomaly_factors.append(min(1.0, (edge_density - 0.22) / 0.15))
    elif edge_density < 0.02:
        anomaly_factors.append(0.4)

    if anomaly_factors:
        anomaly_score = round(float(np.mean(anomaly_factors)), 4)
    else:
        anomaly_score = 0.08  # Baseline normal variation

    return {
        "brightness": brightness,
        "sharpness": sharpness,
        "edgeDensity": edge_density,
        "anomalyScore": anomaly_score,
        "blurDetected": sharpness < 70.0,
        "glareDetected": brightness > 225.0
    }
