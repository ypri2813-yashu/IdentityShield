#!/usr/bin/env python3
"""
IdentityShield - CNN Document Classifier Training Script
Trains a Convolutional Neural Network on Government Documents:
  - Indian Aadhaar Cards (Normal with valid Verhoeff vs. Spliced/Corrupt)
  - Indian PAN Cards (Normal with valid structure vs. Spliced/Invalid status)
  - Indian Driving Licences (Normal Form 7 vs. Altered/Fake State Code)
  - Biometric Passports (Normal ICAO 9303 vs. Broken MRZ check digits)
  - Voter ID Cards (Normal EPIC layout vs. Altered)

Pipeline:
  1. Checks or builds government documents dataset (normal/ & suspicious/)
  2. Splits into 80% Training and 20% Validation sets
  3. Resizes images to 224x224 RGB, applies data augmentation on training set
  4. Trains the 3-Layer Document CNN
  5. Computes loss, accuracy, precision, recall, and confusion matrix
  6. Saves final weights to ml-service/model/document_cnn.pt
"""

import os
import sys
import argparse
import random
import json
import numpy as np
from PIL import Image

# Ensure parent directory is in path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ml-service"))

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import Dataset, DataLoader
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

from cnn_model import DocumentCNN, build_cnn_model, PYTORCH_MODEL_PATH, KERAS_MODEL_PATH

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


class DocumentDataset(Dataset):
    """PyTorch Dataset for document image binary classification with in-memory caching and data augmentation."""
    def __init__(self, file_list, labels, img_size=(224, 224), is_training=False):
        self.file_list = file_list
        self.labels = labels
        self.img_size = img_size
        self.is_training = is_training
        # Preload and resize into RAM once for instant epoch iterations
        self.cached_arrays = []
        for path in file_list:
            img = Image.open(path).convert("RGB")
            img = img.resize(self.img_size, Image.Resampling.LANCZOS)
            arr = np.array(img, dtype=np.float32) / 255.0
            self.cached_arrays.append(arr)

    def __len__(self):
        return len(self.file_list)

    def __getitem__(self, idx):
        arr = self.cached_arrays[idx].copy()
        label = self.labels[idx]

        # Training data augmentation
        if self.is_training:
            # Random subtle brightness jitter
            brightness_factor = random.uniform(0.97, 1.03)
            arr = np.clip(arr * brightness_factor, 0.0, 1.0)

            # Random subtle Gaussian sensor noise
            if random.random() < 0.35:
                noise = np.random.normal(0, 0.008, arr.shape)
                arr = np.clip(arr + noise, 0.0, 1.0)

        # Transpose from (H, W, C) to (C, H, W) for PyTorch
        arr = np.transpose(arr, (2, 0, 1))
        tensor = torch.from_numpy(arr).float()
        target = torch.tensor([label], dtype=torch.float32)

        return tensor, target


def load_dataset_splits(data_dir: str, val_split: float = 0.2, seed: int = 42):
    """Loads all image paths, applies stratified split into train and val."""
    normal_dir = os.path.join(data_dir, "normal")
    suspicious_dir = os.path.join(data_dir, "suspicious")

    if not os.path.exists(normal_dir) or not os.path.exists(suspicious_dir):
        raise FileNotFoundError(f"Missing dataset folders in {data_dir}. Run generate_govt_dataset.py first.")

    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    norm_files = [os.path.join(normal_dir, f) for f in sorted(os.listdir(normal_dir)) if os.path.splitext(f)[1].lower() in valid_exts]
    susp_files = [os.path.join(suspicious_dir, f) for f in sorted(os.listdir(suspicious_dir)) if os.path.splitext(f)[1].lower() in valid_exts]

    if len(norm_files) == 0 or len(susp_files) == 0:
        raise ValueError(f"Dataset is empty ({len(norm_files)} normal, {len(susp_files)} suspicious).")

    random.seed(seed)
    random.shuffle(norm_files)
    random.shuffle(susp_files)

    n_val_norm = max(1, int(len(norm_files) * val_split))
    n_val_susp = max(1, int(len(susp_files) * val_split))

    val_files = norm_files[:n_val_norm] + susp_files[:n_val_susp]
    val_labels = [0.0] * n_val_norm + [1.0] * n_val_susp

    train_files = norm_files[n_val_norm:] + susp_files[n_val_susp:]
    train_labels = [0.0] * (len(norm_files) - n_val_norm) + [1.0] * (len(susp_files) - n_val_susp)

    # Shuffle training set
    combined = list(zip(train_files, train_labels))
    random.shuffle(combined)
    train_files, train_labels = zip(*combined)

    return list(train_files), list(train_labels), val_files, val_labels


def train_pytorch(train_files, train_labels, val_files, val_labels, epochs=12, batch_size=16, lr=0.0003):
    """Trains the DocumentCNN model using PyTorch."""
    print("\n[+] Initializing PyTorch DocumentCNN Training Pipeline...")
    train_dataset = DocumentDataset(train_files, train_labels, is_training=True)
    val_dataset = DocumentDataset(val_files, val_labels, is_training=False)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    device = torch.device("cpu")
    model = DocumentCNN().to(device)

    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)

    print(f"[+] Model Architecture: 3-Layer Document CNN (Conv2D -> MaxPool -> Dropout -> Linear)")
    print(f"[+] Total Parameters: {sum(p.numel() for p in model.parameters()):,}")
    print(f"[+] Training on {len(train_dataset)} images, Validating on {len(val_dataset)} images.")
    print("-" * 70)

    best_val_acc = 0.0
    best_state_dict = None
    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}

    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for images, targets in train_loader:
            images, targets = images.to(device), targets.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            preds = (outputs >= 0.5).float()
            correct += (preds == targets).sum().item()
            total += targets.size(0)

        epoch_train_loss = running_loss / total
        epoch_train_acc = correct / total

        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for images, targets in val_loader:
                images, targets = images.to(device), targets.to(device)
                outputs = model(images)
                loss = criterion(outputs, targets)
                val_loss += loss.item() * images.size(0)
                preds = (outputs >= 0.5).float()
                val_correct += (preds == targets).sum().item()
                val_total += targets.size(0)

        epoch_val_loss = val_loss / val_total
        epoch_val_acc = val_correct / val_total

        history["train_loss"].append(epoch_train_loss)
        history["train_acc"].append(epoch_train_acc)
        history["val_loss"].append(epoch_val_loss)
        history["val_acc"].append(epoch_val_acc)

        if epoch_val_acc >= best_val_acc:
            best_val_acc = epoch_val_acc
            best_state_dict = {k: v.cpu().clone() for k, v in model.state_dict().items()}

        print(f"Epoch [{epoch:02d}/{epochs:02d}] "
              f"Train Loss: {epoch_train_loss:.4f} | Train Acc: {epoch_train_acc * 100:.1f}% | "
              f"Val Loss: {epoch_val_loss:.4f} | Val Acc: {epoch_val_acc * 100:.1f}%")

    # Load best weights
    if best_state_dict is not None:
        model.load_state_dict(best_state_dict)

    # Detailed Evaluation Metrics on Validation set
    model.eval()
    all_preds = []
    all_targets = []
    with torch.no_grad():
        for images, targets in val_loader:
            outputs = model(images)
            preds = (outputs >= 0.5).int().squeeze().tolist()
            if isinstance(preds, int):
                preds = [preds]
            targs = targets.int().squeeze().tolist()
            if isinstance(targs, int):
                targs = [targs]
            all_preds.extend(preds)
            all_targets.extend(targs)

    tp = sum(1 for p, t in zip(all_preds, all_targets) if p == 1 and t == 1)
    tn = sum(1 for p, t in zip(all_preds, all_targets) if p == 0 and t == 0)
    fp = sum(1 for p, t in zip(all_preds, all_targets) if p == 1 and t == 0)
    fn = sum(1 for p, t in zip(all_preds, all_targets) if p == 0 and t == 1)

    precision = tp / (tp + fp) if (tp + fp) > 0 else 1.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 1.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 1.0

    print("\n" + "=" * 70)
    print(" IdentityShield — MODEL EVALUATION ON VALIDATION SPLIT")
    print("=" * 70)
    print(f" Final Validation Accuracy : {history['val_acc'][-1] * 100:.2f}% (Best: {best_val_acc * 100:.2f}%)")
    print(f" Final Validation Loss     : {history['val_loss'][-1]:.4f}")
    print(f" Precision (Suspicious)    : {precision * 100:.2f}%")
    print(f" Recall (Suspicious)       : {recall * 100:.2f}%")
    print(f" F1-Score                  : {f1 * 100:.2f}%")
    print(f"\n Confusion Matrix:")
    print(f"   • True Negatives (Authentic Docs Correctly Verified) : {tn}")
    print(f"   • False Positives (Authentic Docs Flagged Suspicious): {fp}")
    print(f"   • True Positives (Forged Docs Correctly Flagged)     : {tp}")
    print(f"   • False Negatives (Forged Docs Missed)               : {fn}")
    print("=" * 70)

    # Save trained weights
    os.makedirs(os.path.dirname(PYTORCH_MODEL_PATH), exist_ok=True)
    torch.save(model.state_dict(), PYTORCH_MODEL_PATH)
    print(f"\n✓ Trained model weights successfully saved to: {PYTORCH_MODEL_PATH}")

    meta_path = os.path.join(os.path.dirname(PYTORCH_MODEL_PATH), "document_cnn_meta.json")
    with open(meta_path, "w") as f:
        json.dump({
            "framework": "PyTorch",
            "epochs": epochs,
            "validation_accuracy": round(history["val_acc"][-1], 4),
            "validation_loss": round(history["val_loss"][-1], 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "dataset_info": {
                "training_samples": len(train_dataset),
                "validation_samples": len(val_dataset),
                "classes": ["Normal (Authentic)", "Suspicious (Forged)"]
            }
        }, f, indent=2)

    return model


def main():
    parser = argparse.ArgumentParser(description="Train IdentityShield CNN on Government Documents Dataset")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs (default: 15)")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size (default: 16)")
    parser.add_argument("--lr", type=float, default=0.0005, help="Learning rate (default: 0.0005)")
    parser.add_argument("--regenerate-dataset", action="store_true", help="Force regenerate synthetic govt documents")
    args = parser.parse_args()

    print("=" * 70)
    print(" IdentityShield — Government Document CNN Training Pipeline")
    print("=" * 70)

    # Ensure dataset exists
    normal_dir = os.path.join(DATA_DIR, "normal")
    suspicious_dir = os.path.join(DATA_DIR, "suspicious")

    needs_generation = args.regenerate_dataset or not os.path.exists(normal_dir) or len(os.listdir(normal_dir)) < 10

    if needs_generation:
        print("[!] Dataset missing or regeneration requested. Generating government documents dataset...")
        from generate_govt_dataset import generate_dataset
        generate_dataset(DATA_DIR, samples_per_class=150)

    # Load splits
    train_files, train_labels, val_files, val_labels = load_dataset_splits(DATA_DIR, val_split=0.2, seed=42)

    if TORCH_AVAILABLE:
        train_pytorch(train_files, train_labels, val_files, val_labels, epochs=args.epochs, batch_size=args.batch_size, lr=args.lr)
    else:
        print("Error: PyTorch is not available.")
        sys.exit(1)


if __name__ == "__main__":
    main()
