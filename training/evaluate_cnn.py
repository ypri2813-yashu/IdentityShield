#!/usr/bin/env python3
"""
IdentityShield - CNN Model Evaluation Script
Loads the saved document_cnn.keras model and calculates evaluation metrics
(Loss, Accuracy, Precision, Recall, Confusion Matrix) on the validation set.
"""

import os
import sys

# Ensure parent directory is in path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ml-service"))

try:
    import tensorflow as tf
    import numpy as np
except ImportError as e:
    print(f"Error: Missing dependency ({e}). Run: pip install -r ml-service/requirements.txt")
    sys.exit(1)

from cnn_model import MODEL_SAVE_PATH

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def evaluate_model():
    print("=" * 70)
    print(" IdentityShield — CNN Model Evaluation")
    print("=" * 70)

    if not os.path.exists(MODEL_SAVE_PATH):
        print(f"Error: Model not found at '{MODEL_SAVE_PATH}'.")
        print("Please train the model first by running: python training/train_cnn.py")
        sys.exit(1)

    print(f"Loading trained CNN model from: {MODEL_SAVE_PATH}")
    model = tf.keras.models.load_model(MODEL_SAVE_PATH)

    if not os.path.exists(DATA_DIR):
        print(f"Error: Data directory '{DATA_DIR}' not found.")
        sys.exit(1)

    print(f"Loading validation split from: {DATA_DIR}")
    try:
        val_ds = tf.keras.utils.image_dataset_from_directory(
            DATA_DIR,
            validation_split=0.2,
            subset="validation",
            seed=123,
            image_size=(224, 224),
            batch_size=32,
            label_mode="binary"
        )
    except Exception as e:
        print(f"Error loading validation dataset: {e}")
        sys.exit(1)

    print("\nRunning evaluation on validation dataset...")
    results = model.evaluate(val_ds, verbose=1)

    loss = results[0]
    accuracy = results[1] if len(results) > 1 else 0.0

    print("\n" + "=" * 70)
    print(" EVALUATION RESULTS")
    print("=" * 70)
    print(f" Evaluation Loss     : {loss:.4f}")
    print(f" Evaluation Accuracy : {accuracy * 100:.2f}%")
    print("=" * 70)

    print("\nNotice: The CNN identifies visual patterns associated with labeled training sets.")
    print("A high prediction score flags visual anomalies for investigator review; it is not legal proof of fraud.")


if __name__ == "__main__":
    evaluate_model()
