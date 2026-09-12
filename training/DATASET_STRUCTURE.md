# IdentityShield — CNN Training Dataset Structure & Guidelines

This document outlines how to prepare, organize, and structure the dataset used to train the IdentityShield Convolutional Neural Network (CNN) document classifier.

---

## 1. Directory Structure

Place all training images in the `training/data/` directory categorized into two subfolders:

```text
training/
└── data/
    ├── normal/
    │   ├── doc_normal_001.jpg
    │   ├── doc_normal_002.png
    │   └── ...
    │
    └── suspicious/
        ├── doc_tampered_001.jpg
        ├── doc_anomalous_002.png
        └── ...
```

- **`normal/`**: Unmodified, authentic, or clean document samples showing expected layout borders, uniform background textures, and consistent typography.
- **`suspicious/`**: Modified, tampered, digitally spliced, misaligned, or artifact-heavy document images.

---

## 2. Dataset Guidelines & Legal / Privacy Notice

> [!CAUTION]
> **STRICT PRIVACY WARNING: NEVER USE REAL PERSONALLY IDENTIFIABLE INFORMATION (PII)**
> - Do **NOT** train on real private Aadhaar cards, real national ID cards, real passports, or un-redacted personal identity documents.
> - Identity documents contain sensitive biometric, demographic, and legal data. Committing or utilizing un-redacted personal documents violates data protection laws (e.g. GDPR, DPDP Act, CCPA).

### Recommended Lawful Sources:
1. **Public Research Benchmarks**:
   - **MIDV-500 / MIDV-2019**: Academic dataset of identity document mockups with various camera angles and lighting.
   - **DocTamper / Forensic Datasets**: Academic benchmarks designed specifically for document splicing and tampering research.
2. **Synthetic Data Generation**:
   - For rapid testing or prototyping without external downloads, `train_cnn.py` includes a built-in synthetic generator:
     ```bash
     python train_cnn.py --generate-sample-data
     ```
   - This creates 100 sample documents per class with synthetic text, borders, and simulated tampering overlays to allow end-to-end training verification immediately.

---

## 3. Dataset Specifications for Keras Pipeline

The training pipeline uses `tf.keras.utils.image_dataset_from_directory()` configured with:
- **Image Size**: `224 × 224` pixels (RGB)
- **Batch Size**: `32`
- **Data Split**: `80%` Training, `20%` Validation
- **Label Mode**: `binary` (`0` for `normal`, `1` for `suspicious`)
- **Recommended Minimum Count**: At least 50–100 images per class for meaningful validation.

---

## 4. Model Limitations & Ethical Considerations

- **Pattern Recognition Only**: The CNN identifies visual texture patterns, compression artifacts, and layout anomalies learned from the training distribution. It does **not** authenticate watermarks, government cryptographic signatures, or chip data.
- **Human in the Loop**: Results are risk-screening indicators. A high-risk score means the document warrants human inspection, not that fraud is legally established.
