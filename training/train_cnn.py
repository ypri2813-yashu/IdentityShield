#!/usr/bin/env python3
"""
IdentityShield - CNN Document Classifier Training Script
Trains a binary convolutional neural network on document images:
  Class 0: Normal
  Class 1: Suspicious

Pipeline:
  1. Loads dataset from training/data/ (normal/ & suspicious/)
  2. Splits into 80% Training and 20% Validation
  3. Resizes images to 224x224
  4. Trains the CNN model
  5. Displays training loss, training accuracy, and validation metrics
  6. Saves final model to ml-service/model/document_cnn.keras
"""

import os
import sys
import argparse
import numpy as np

# Ensure parent directory is in path so we can import from ml-service
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ml-service"))

try:
    import tensorflow as tf
    from tensorflow.keras import layers, models
    from PIL import Image, ImageDraw, ImageFont
except ImportError as e:
    print(f"Error: Missing dependency ({e}). Please run: pip install -r ml-service/requirements.txt")
    sys.exit(1)

from cnn_model import build_cnn_model

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
OUTPUT_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml-service", "model", "document_cnn.keras")


def generate_synthetic_data_if_needed(target_dir: str, samples_per_class: int = 40):
    """
    Generates synthetic sample document images for immediate testing if no real dataset is present.
    This lets beginners run the entire training pipeline immediately without downloading large datasets.
    """
    normal_dir = os.path.join(target_dir, "normal")
    suspicious_dir = os.path.join(target_dir, "suspicious")

    os.makedirs(normal_dir, exist_ok=True)
    os.makedirs(suspicious_dir, exist_ok=True)

    normal_count = len(os.listdir(normal_dir))
    suspicious_count = len(os.listdir(suspicious_dir))

    if normal_count >= 20 and suspicious_count >= 20:
        print(f"Dataset detected: {normal_count} normal, {suspicious_count} suspicious images.")
        return

    print(f"Generating {samples_per_class} synthetic sample document images per class for pipeline verification...")

    for i in range(samples_per_class):
        # 1. Normal document: Clean off-white card, uniform header bar, clean text lines
        img_norm = Image.new("RGB", (400, 260), color=(245, 246, 250))
        draw_n = ImageDraw.Draw(img_norm)
        # Header banner
        draw_n.rectangle([10, 10, 390, 45], fill=(30, 41, 59))
        draw_n.text((20, 20), "REPUBLIC IDENTITY SPECIMEN", fill=(255, 255, 255))
        # Photo box
        draw_n.rectangle([20, 60, 110, 180], fill=(203, 213, 225), outline=(148, 163, 184))
        # Text fields
        for line_y, label in zip([65, 95, 125, 155, 185], ["NAME: SPECIMEN", "DOB: 12/04/1990", "SEX: M", "EXP: 2030", "ID: 994-201-44"]):
            draw_n.text((130, line_y), label, fill=(15, 23, 42))
        img_norm.save(os.path.join(normal_dir, f"sample_normal_{i:03d}.jpg"), quality=95)

        # 2. Suspicious document: Tampered layout, inconsistent block colors, noisy overlay
        img_susp = Image.new("RGB", (400, 260), color=(240, 240, 242))
        draw_s = ImageDraw.Draw(img_susp)
        draw_s.rectangle([10, 10, 390, 45], fill=(30, 41, 59))
        draw_s.text((20, 20), "REPUBLIC IDENTITY SPECIMEN", fill=(255, 255, 255))
        draw_s.rectangle([20, 60, 110, 180], fill=(180, 180, 190), outline=(100, 100, 100))
        for line_y, label in zip([65, 95, 125, 155, 185], ["NAME: SPECIMEN", "DOB: 12/04/1990", "SEX: M", "EXP: 2030", "ID: 994-201-44"]):
            draw_s.text((130, line_y), label, fill=(15, 23, 42))
        
        # Tamper simulation: spliced date of birth patch with conflicting background and font
        draw_s.rectangle([125, 90, 260, 115], fill=(255, 230, 230), outline=(239, 68, 68))
        draw_s.text((130, 95), "DOB: 01/01/2005 [SPLICED]", fill=(185, 28, 28))
        # Random noise smudge
        noise = np.random.randint(0, 50, (50, 50, 3), dtype=np.uint8)
        noise_img = Image.fromarray(noise)
        img_susp.paste(noise_img, (300, 150))
        img_susp.save(os.path.join(suspicious_dir, f"sample_suspicious_{i:03d}.jpg"), quality=95)

    print("Synthetic dataset generated in training/data/ (normal/ & suspicious/).")


def main():
    parser = argparse.ArgumentParser(description="Train IdentityShield CNN Document Screening Model")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs (default: 10)")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size (default: 32)")
    parser.add_argument("--generate-sample-data", action="store_true", help="Generate sample dataset if empty")
    args = parser.parse_args()

    print("=" * 70)
    print(" IdentityShield — CNN Document Classifier Training Pipeline")
    print("=" * 70)

    # Ensure data directory exists
    os.makedirs(DATA_DIR, exist_ok=True)
    generate_synthetic_data_if_needed(DATA_DIR, samples_per_class=40)

    # 1. Load dataset with 80% train / 20% validation split
    print("\nLoading dataset from:", DATA_DIR)
    try:
        train_ds, val_ds = tf.keras.utils.image_dataset_from_directory(
            DATA_DIR,
            validation_split=0.2,
            subset="both",
            seed=123,
            image_size=(224, 224),
            batch_size=args.batch_size,
            label_mode="binary"
        )
    except Exception as e:
        print(f"Failed to load dataset: {e}")
        print("Please review training/DATASET_STRUCTURE.md and ensure training/data/ contains 'normal' and 'suspicious' folders.")
        sys.exit(1)

    class_names = train_ds.class_names
    print(f"Detected classes: {class_names} (0 = {class_names[0]}, 1 = {class_names[1]})")

    # Optimize data pipeline caching & prefetching
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.cache().prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)

    # 2. Build the CNN Model
    print("\nBuilding CNN Architecture:")
    model = build_cnn_model(input_shape=(224, 224, 3))
    model.summary()

    # 3. Train Model
    print(f"\nStarting training for {args.epochs} epochs (Batch size: {args.batch_size})...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs,
        verbose=1
    )

    # 4. Display Final Metrics
    final_train_acc = history.history['accuracy'][-1]
    final_val_acc = history.history['val_accuracy'][-1]
    final_loss = history.history['loss'][-1]
    final_val_loss = history.history['val_loss'][-1]

    print("\n" + "=" * 70)
    print(" TRAINING SUMMARY")
    print("=" * 70)
    print(f" Final Training Accuracy   : {final_train_acc * 100:.2f}%")
    print(f" Final Validation Accuracy : {final_val_acc * 100:.2f}%")
    print(f" Final Training Loss       : {final_loss:.4f}")
    print(f" Final Validation Loss     : {final_val_loss:.4f}")
    print("=" * 70)

    # 5. Save Model
    os.makedirs(os.path.dirname(OUTPUT_MODEL_PATH), exist_ok=True)
    model.save(OUTPUT_MODEL_PATH)
    print(f"\n✓ Model successfully saved to: {OUTPUT_MODEL_PATH}")
    print("You can now launch the Python FastAPI service via:")
    print("  uvicorn main:app --reload --port 8000")


if __name__ == "__main__":
    main()
