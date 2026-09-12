#!/usr/bin/env python3
"""
IdentityShield - CNN Document Single-Image Prediction Script
Accepts an image path, preprocesses it, feeds it to the trained CNN model,
and prints the predicted class and confidence score.

Usage:
  python training/predict_cnn.py --image path/to/document.jpg
"""

import os
import sys
import argparse

# Ensure parent directory is in path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ml-service"))

try:
    import numpy as np
    from PIL import Image
except ImportError as e:
    print(f"Error: Missing dependency ({e}). Run: pip install -r ml-service/requirements.txt")
    sys.exit(1)

from cnn_model import load_screening_model, predict_document_image, MODEL_SAVE_PATH


def main():
    parser = argparse.ArgumentParser(description="Predict single document image using IdentityShield CNN")
    parser.add_argument("--image", type=str, required=True, help="Path to document image file (JPG, PNG, WebP)")
    args = parser.parse_args()

    image_path = args.image
    if not os.path.exists(image_path):
        print(f"Error: Specified image '{image_path}' does not exist.")
        sys.exit(1)

    print("=" * 70)
    print(" IdentityShield — CNN Document Image Predictor")
    print("=" * 70)
    print(f"Target Image: {image_path}")

    # Load trained model
    model, error = load_screening_model(MODEL_SAVE_PATH)
    if model is None:
        print(f"\n[!] Model Error: {error}")
        print("Please train the CNN model first: python training/train_cnn.py")
        sys.exit(1)

    # Load and resize image to 224x224 RGB
    try:
        pil_img = Image.open(image_path).convert("RGB")
        resized_img = pil_img.resize((224, 224), Image.Resampling.LANCZOS)
        img_array = np.array(resized_img, dtype=np.float32)
    except Exception as e:
        print(f"Error decoding image: {e}")
        sys.exit(1)

    # Run inference
    predicted_class, confidence, raw_prob = predict_document_image(model, img_array)

    print("\n" + "-" * 70)
    print(f" PREDICTED CLASS : {predicted_class.upper()}")
    print(f" CONFIDENCE      : {confidence * 100:.2f}%")
    print(f" RAW PROBABILITY : {raw_prob:.4f} (Probability of Suspicious pattern)")
    print("-" * 70)

    if predicted_class == "Suspicious":
        print(" Recommendation: High Risk — Further human verification recommended.")
        print(" Note: Indicates visual anomalies matching known altered samples.")
    else:
        print(" Recommendation: Low Risk — Document visual patterns align with normal samples.")

    print("\nDisclaimer: This model flags visual patterns and does not constitute legal proof.")


if __name__ == "__main__":
    main()
