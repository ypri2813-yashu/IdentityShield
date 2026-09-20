#!/usr/bin/env python3
"""
IdentityShield - CNN Model Evaluation Script
Loads the trained CNN model (PyTorch document_cnn.pt or Keras document_cnn.keras)
and calculates evaluation metrics (Loss, Accuracy, Precision, Recall, F1, Confusion Matrix)
on the validation dataset.
"""

import os
import sys
import json
import numpy as np
from PIL import Image

# Ensure parent directory is in path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ml-service"))

try:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

from cnn_model import (
    load_screening_model,
    PYTORCH_MODEL_PATH,
    KERAS_MODEL_PATH,
    MODEL_SAVE_PATH
)
from train_cnn import DocumentDataset, load_dataset_splits

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def evaluate_model():
    print("=" * 70)
    print(" IdentityShield — Government Document CNN Model Evaluation")
    print("=" * 70)

    # Check model path
    target_path = PYTORCH_MODEL_PATH if os.path.exists(PYTORCH_MODEL_PATH) else KERAS_MODEL_PATH
    if not os.path.exists(target_path):
        print(f"Error: Model not found at '{target_path}'.")
        print("Please train the model first by running: python training/train_cnn.py")
        sys.exit(1)

    print(f"Loading trained CNN model from: {target_path}")
    model, error = load_screening_model(target_path)
    if model is None:
        print(f"Error loading model: {error}")
        sys.exit(1)

    if not os.path.exists(DATA_DIR):
        print(f"Error: Data directory '{DATA_DIR}' not found.")
        sys.exit(1)

    # Load validation split
    print(f"Loading evaluation dataset from: {DATA_DIR}")
    _, _, val_files, val_labels = load_dataset_splits(DATA_DIR, val_split=0.2, seed=42)

    val_dataset = DocumentDataset(val_files, val_labels, is_training=False)
    val_loader = DataLoader(val_dataset, batch_size=16, shuffle=False)

    criterion = nn.BCELoss()
    val_loss = 0.0
    all_preds = []
    all_targets = []
    all_probs = []

    model.eval()
    with torch.no_grad():
        for images, targets in val_loader:
            outputs = model(images)
            loss = criterion(outputs, targets)
            val_loss += loss.item() * images.size(0)

            probs = outputs.squeeze().tolist()
            if isinstance(probs, float):
                probs = [probs]
            preds = (outputs >= 0.5).int().squeeze().tolist()
            if isinstance(preds, int):
                preds = [preds]
            targs = targets.int().squeeze().tolist()
            if isinstance(targs, int):
                targs = [targs]

            all_probs.extend(probs)
            all_preds.extend(preds)
            all_targets.extend(targs)

    total_samples = len(val_dataset)
    avg_loss = val_loss / total_samples
    correct = sum(1 for p, t in zip(all_preds, all_targets) if p == t)
    accuracy = correct / total_samples

    tp = sum(1 for p, t in zip(all_preds, all_targets) if p == 1 and t == 1)
    tn = sum(1 for p, t in zip(all_preds, all_targets) if p == 0 and t == 0)
    fp = sum(1 for p, t in zip(all_preds, all_targets) if p == 1 and t == 0)
    fn = sum(1 for p, t in zip(all_preds, all_targets) if p == 0 and t == 1)

    precision = tp / (tp + fp) if (tp + fp) > 0 else 1.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 1.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 1.0

    print("\n" + "=" * 70)
    print(" EVALUATION RESULTS ON VALIDATION SPLIT")
    print("=" * 70)
    print(f" Total Evaluated Documents: {total_samples}")
    print(f" Evaluation Loss          : {avg_loss:.4f}")
    print(f" Evaluation Accuracy      : {accuracy * 100:.2f}%")
    print(f" Precision (Tampered)     : {precision * 100:.2f}%")
    print(f" Recall (Tampered)        : {recall * 100:.2f}%")
    print(f" F1-Score                 : {f1 * 100:.2f}%")
    print(f"\n Confusion Matrix:")
    print(f"   • True Negatives  (Authentic Verified) : {tn}")
    print(f"   • False Positives (Authentic Flagged)  : {fp}")
    print(f"   • True Positives  (Forged Flagged)     : {tp}")
    print(f"   • False Negatives (Forged Missed)      : {fn}")
    print("=" * 70)

    print("\nNotice: The CNN identifies visual patterns associated with labeled training sets.")
    print("A high prediction score flags visual anomalies for investigator review; it is not legal proof of fraud.")


if __name__ == "__main__":
    evaluate_model()
