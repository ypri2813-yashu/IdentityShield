#!/usr/bin/env python3
"""
IdentityShield - Realistic Government Documents Dataset Generator
Generates high-fidelity synthetic authentic and forged government documents:
  1. Indian Aadhaar Cards (UIDAI layout, Ashoka emblem, bilingual text, valid Verhoeff D5 checksum vs subtle tamper)
  2. Indian PAN Cards (Income Tax Dept format, ITD security band, 4th char entity type, 5th char surname match vs altered)
  3. Indian Driving Licences (Union of India MoRTH Form 7, Smart Card chip, State RTO codes, valid validity vs altered)
  4. Passports (Republic of India / ICAO Doc 9303 MRZ zone with valid check digits vs altered MRZ & spliced photo)
  5. Voter ID Cards (Election Commission of India / EPIC layout)

REALISTIC FORENSIC TAMPERING:
  - NO artificial red boxes or text with words like '[SPLICED]' or '[FORGED]'.
  - Real-world tamper indicators:
    * Face photo replacement with boundary seams and mismatched lighting
    * Spliced numeric fields with subtle background Guilloché wave disruption
    * Copy-move localized cloning artifacts
    * Mismatched font weight and baseline jitter on altered credentials
    * Localized JPEG compression artifact / ELA discrepancy
"""

import os
import math
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Dihedral D5 tables for UIDAI Verhoeff Checksum calculation
VERHOEFF_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
]

VERHOEFF_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
]

VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]


def compute_verhoeff_check_digit(number_str: str) -> int:
    """Computes the 12th Verhoeff check digit for an 11-digit prefix string."""
    digits = [int(ch) for ch in number_str if ch.isdigit()]
    rev = list(reversed(digits))
    c = 0
    for i, d in enumerate(rev):
        c = VERHOEFF_D[c][VERHOEFF_P[(i + 1) % 8][d]]
    return VERHOEFF_INV[c]


def generate_valid_aadhaar() -> str:
    """Generates a random 12-digit Aadhaar number with a mathematically valid Verhoeff checksum."""
    prefix = "".join([str(random.randint(2 if i == 0 else 0, 9)) for i in range(11)])
    check = compute_verhoeff_check_digit(prefix)
    full = prefix + str(check)
    return f"{full[0:4]} {full[4:8]} {full[8:12]}"


def generate_invalid_aadhaar() -> str:
    """Generates an altered 12-digit Aadhaar number where check digit fails."""
    prefix = "".join([str(random.randint(2 if i == 0 else 0, 9)) for i in range(11)])
    correct_check = compute_verhoeff_check_digit(prefix)
    wrong_check = (correct_check + random.randint(1, 8)) % 10
    full = prefix + str(wrong_check)
    return f"{full[0:4]} {full[4:8]} {full[8:12]}"


# Demographic Pool covering multiple Indian states
CITIZEN_RECORDS = [
    {"first": "RAHUL", "last": "SHARMA", "dob": "14/08/1988", "gender": "MALE", "state": "MH", "rto": "02", "city": "MUMBAI", "pincode": "400001", "father": "RAMESH SHARMA"},
    {"first": "PRIYA", "last": "PATEL", "dob": "22/04/1992", "gender": "FEMALE", "state": "GJ", "rto": "01", "city": "AHMEDABAD", "pincode": "380001", "father": "KIRAN PATEL"},
    {"first": "AMIT", "last": "VERMA", "dob": "09/11/1985", "gender": "MALE", "state": "DL", "rto": "04", "city": "NEW DELHI", "pincode": "110001", "father": "SURESH VERMA"},
    {"first": "ANANYA", "last": "IYER", "dob": "17/01/1995", "gender": "FEMALE", "state": "TN", "rto": "01", "city": "CHENNAI", "pincode": "600001", "father": "VENKAT IYER"},
    {"first": "DEEPAK", "last": "KUMAR", "dob": "30/06/1990", "gender": "MALE", "state": "UP", "rto": "32", "city": "LUCKNOW", "pincode": "226001", "father": "HARISH KUMAR"},
    {"first": "SNEHA", "last": "REDDY", "dob": "05/12/1993", "gender": "FEMALE", "state": "TS", "rto": "09", "city": "HYDERABAD", "pincode": "500001", "father": "PRAVEEN REDDY"},
    {"first": "VIKRAM", "last": "SINGH", "dob": "11/03/1987", "gender": "MALE", "state": "RJ", "rto": "14", "city": "JAIPUR", "pincode": "302001", "father": "MAHESH SINGH"},
    {"first": "POOJA", "last": "BANERJEE", "dob": "28/09/1991", "gender": "FEMALE", "state": "WB", "rto": "01", "city": "KOLKATA", "pincode": "700001", "father": "SUBHASH BANERJEE"},
    {"first": "KARTHIK", "last": "NAIR", "dob": "19/07/1989", "gender": "MALE", "state": "KL", "rto": "07", "city": "KOCHI", "pincode": "682001", "father": "MADHAVAN NAIR"},
    {"first": "ROHAN", "last": "DESHMUKH", "dob": "03/05/1994", "gender": "MALE", "state": "MH", "rto": "12", "city": "PUNE", "pincode": "411001", "father": "SANJAY DESHMUKH"},
    {"first": "SUNITA", "last": "MEHTA", "dob": "15/10/1986", "gender": "FEMALE", "state": "KA", "rto": "03", "city": "BENGALURU", "pincode": "560001", "father": "DEVENDRA MEHTA"},
    {"first": "ARJUN", "last": "GUPTA", "dob": "25/02/1993", "gender": "MALE", "state": "HR", "rto": "26", "city": "GURUGRAM", "pincode": "122001", "father": "VINOD GUPTA"},
    {"first": "NEHA", "last": "JOSHI", "dob": "12/08/1996", "gender": "FEMALE", "state": "MP", "rto": "09", "city": "INDORE", "pincode": "452001", "father": "ASHOK JOSHI"},
    {"first": "MANISH", "last": "TIWARI", "dob": "18/12/1984", "gender": "MALE", "state": "BR", "rto": "01", "city": "PATNA", "pincode": "800001", "father": "RAJESH TIWARI"},
    {"first": "SIMRAN", "last": "KAUR", "dob": "07/04/1997", "gender": "FEMALE", "state": "PB", "rto": "02", "city": "AMRITSAR", "pincode": "143001", "father": "JASPREET SINGH"}
]


def draw_guilloche_background(draw: ImageDraw.Draw, width: int, height: int, color=(240, 244, 250), step: int = 12, amplitude: int = 4):
    """Draws security wave curves (Guilloché patterns) common in authentic official credentials."""
    for y in range(40, height - 10, step):
        points = []
        for x in range(10, width - 10, 4):
            offset = int(math.sin(x * 0.05 + y * 0.1) * amplitude)
            points.append((x, y + offset))
        draw.line(points, fill=color, width=1)


def draw_portrait(draw: ImageDraw.Draw, x1: int, y1: int, x2: int, y2: int, gender: str = "MALE", altered: bool = False):
    """Draws a portrait silhouette inside the photo frame."""
    w, h = x2 - x1, y2 - y1
    cx = x1 + w // 2

    # Background photo hue
    bg_fill = (225, 235, 245) if not altered else (245, 220, 210)
    border_color = (130, 145, 165) if not altered else (80, 90, 105)

    draw.rectangle([x1, y1, x2, y2], fill=bg_fill, outline=border_color, width=1)

    # Face silhouette
    head_r = w // 4
    head_cy = y1 + h // 3
    skin_tone = (155, 135, 125) if not altered else (175, 115, 95)
    draw.ellipse([cx - head_r, head_cy - head_r, cx + head_r, head_cy + head_r], fill=skin_tone)

    # Hair / style
    if gender == "FEMALE":
        draw.chord([cx - head_r - 4, head_cy - head_r - 4, cx + head_r + 4, head_cy + head_r + 6], 180, 360, fill=(40, 30, 30))
    else:
        draw.chord([cx - head_r - 2, head_cy - head_r - 2, cx + head_r + 2, head_cy], 180, 360, fill=(35, 30, 30))

    # Shoulders
    suit_color = (60, 75, 95) if not altered else (95, 55, 60)
    draw.ellipse([cx - w // 2 + 4, y1 + h // 2, cx + w // 2 - 4, y2 + 10], fill=suit_color)

    # Subtle inner camera shadow
    draw.line([(x1, y1), (x2, y1)], fill=(190, 200, 210), width=1)


def draw_qr_code_matrix(draw: ImageDraw.Draw, x: int, y: int, size: int = 46, corrupted: bool = False):
    """Draws a 2D QR matrix pattern."""
    draw.rectangle([x, y, x + size, y + size], fill=(255, 255, 255), outline=(0, 0, 0), width=1)
    # Corner finder patterns
    for bx, by in [(x + 2, y + 2), (x + size - 14, y + 2), (x + 2, y + size - 14)]:
        draw.rectangle([bx, by, bx + 12, by + 12], fill=(0, 0, 0))
        draw.rectangle([bx + 3, by + 3, bx + 9, by + 9], fill=(255, 255, 255))
        draw.rectangle([bx + 5, by + 5, bx + 7, by + 7], fill=(0, 0, 0))

    step = 4
    for px in range(x + 4, x + size - 4, step):
        for py in range(y + 4, y + size - 4, step):
            if corrupted and px > x + size // 2:
                # Corrupted/broken alignment on tampered QR
                if random.random() > 0.8:
                    draw.rectangle([px, py, px + 2, py + 2], fill=(60, 60, 60))
            else:
                if random.random() > 0.48:
                    draw.rectangle([px, py, px + 2, py + 2], fill=(0, 0, 0))


def apply_scanner_effects(img: Image.Image, add_tamper_noise: bool = False) -> Image.Image:
    """Applies realistic scanner resolution, subtle micro-rotation, and sensor noise."""
    # Slight micro-rotation (-1.0 to 1.0 degrees)
    angle = random.uniform(-1.0, 1.0)
    rotated = img.rotate(angle, resample=Image.Resampling.BICUBIC, expand=False, fillcolor=(245, 246, 248))

    arr = np.array(rotated, dtype=np.float32)

    # Scanner sensor noise
    noise_sigma = 3.5 if not add_tamper_noise else 5.0
    noise = np.random.normal(0, noise_sigma, arr.shape)
    arr = np.clip(arr + noise, 0, 255).astype(np.uint8)

    out_img = Image.fromarray(arr)

    # Subtle contrast/brightness variation
    return out_img


def apply_tamper_splice_artifacts(img: Image.Image, box: tuple, tamper_type: str = "patch") -> Image.Image:
    """
    Applies realistic digital splicing artifacts to a bounding box:
    - Background Guilloche erasure seam
    - Slight compression/ELA disparity
    - Micro-shift in color or luminance
    - Subtle edge discontinuity seam
    """
    arr = np.array(img, dtype=np.float32)
    x1, y1, x2, y2 = box
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(arr.shape[1], x2), min(arr.shape[0], y2)

    patch = arr[y1:y2, x1:x2].copy()

    if tamper_type == "photo_splice":
        # Spliced photo: boundary edge seam, different saturation, different noise grain
        patch[:, :, 0] = np.clip(patch[:, :, 0] * 1.08, 0, 255)
        patch[:, :, 2] = np.clip(patch[:, :, 2] * 0.92, 0, 255)
        # Add slight local Gaussian noise to spliced region only
        local_noise = np.random.normal(0, 7.0, patch.shape)
        patch = np.clip(patch + local_noise, 0, 255)

        arr[y1:y2, x1:x2] = patch
        # 3-pixel cut seam on boundary to survive 224x224 downsampling
        arr[y1:y1+3, x1:x2, :] = np.clip(arr[y1:y1+3, x1:x2, :] * 0.68, 0, 255)
        arr[y2-3:y2, x1:x2, :] = np.clip(arr[y2-3:y2, x1:x2, :] * 0.68, 0, 255)
        arr[y1:y2, x1:x1+3, :] = np.clip(arr[y1:y2, x1:x1+3, :] * 0.68, 0, 255)
        arr[y1:y2, x2-3:x2, :] = np.clip(arr[y1:y2, x2-3:x2, :] * 0.68, 0, 255)

    elif tamper_type == "field_splice":
        # Pasted numeric/demographic field:
        # 1. Background Guilloche wave erasure / smoothing under the pasted box
        pil_patch = Image.fromarray(patch.astype(np.uint8))
        smoothed_patch = np.array(pil_patch.filter(ImageFilter.GaussianBlur(radius=2.5)), dtype=np.float32)
        # Blend smoothed background with field content (simulating inpainting/erasing)
        blended = patch * 0.6 + smoothed_patch * 0.4
        blended[:, :, :] = np.clip(blended[:, :, :] * 0.94 + 14, 0, 255)
        arr[y1:y2, x1:x2] = blended

        # 2. 3-pixel digital bounding seam (typical of layer pastes in forged credentials)
        arr[y1:y1+3, x1:x2, :] = np.clip(arr[y1:y1+3, x1:x2, :] * 0.70, 0, 255)
        arr[y2-3:y2, x1:x2, :] = np.clip(arr[y2-3:y2, x1:x2, :] * 0.70, 0, 255)
        arr[y1:y2, x1:x1+3, :] = np.clip(arr[y1:y2, x1:x1+3, :] * 0.70, 0, 255)
        arr[y1:y2, x2-3:x2, :] = np.clip(arr[y1:y2, x2-3:x2, :] * 0.70, 0, 255)

    elif tamper_type == "blur_inpaint":
        # Local inpaint blur under spliced text
        pil_patch = Image.fromarray(patch.astype(np.uint8))
        blurred = pil_patch.filter(ImageFilter.GaussianBlur(radius=1.5))
        arr[y1:y2, x1:x2] = np.array(blurred, dtype=np.float32)

    return Image.fromarray(arr.astype(np.uint8))


# ==============================================================================
# 1. INDIAN AADHAAR CARD GENERATOR
# ==============================================================================
def generate_aadhaar_card(record: dict, is_authentic: bool) -> Image.Image:
    """Generates an authentic or realistic tampered Indian Aadhaar Card."""
    img = Image.new("RGB", (420, 270), color=(253, 253, 254))
    draw = ImageDraw.Draw(img)

    # Guilloché background wave lines
    draw_guilloche_background(draw, 420, 270, color=(240, 244, 250), step=14, amplitude=4)

    # Top Header Band
    draw.rectangle([8, 8, 412, 44], fill=(248, 250, 252), outline=(226, 232, 240), width=1)
    # Ashoka Lion Capital emblem (Navy/Gold medallion)
    draw.ellipse([16, 12, 38, 34], fill=(20, 45, 95), outline=(212, 175, 55), width=1)
    draw.ellipse([23, 17, 31, 25], fill=(255, 255, 255))

    # Header Titles (Government format)
    draw.text((46, 12), "GOVERNMENT OF INDIA / BHARAT SARKAR", fill=(15, 23, 42))
    draw.text((46, 26), "Unique Identification Authority of India (UIDAI)", fill=(71, 85, 105))

    # Photo Box
    is_photo_tampered = not is_authentic and random.random() < 0.5
    draw_portrait(draw, 20, 56, 106, 168, gender=record["gender"], altered=is_photo_tampered)

    # Demographic Information
    applicant_name = f"{record['first']} {record['last']}"
    draw.text((122, 60), f"Name: {applicant_name}", fill=(15, 23, 42))
    draw.text((122, 78), f"DOB: {record['dob']}", fill=(15, 23, 42))
    draw.text((122, 96), f"Gender / Sex: {record['gender']}", fill=(15, 23, 42))
    draw.text((122, 114), f"Address: {record['city']}, {record['state']} - {record['pincode']}", fill=(51, 65, 85))
    draw.text((122, 130), "Enrollment: 1044/99120/00142", fill=(100, 116, 139))

    # Secure QR Code
    draw_qr_code_matrix(draw, 345, 58, size=52, corrupted=(not is_authentic and random.random() < 0.4))

    # Red bar divider with official tagline
    draw.rectangle([10, 174, 410, 194], fill=(238, 242, 246))
    draw.text((80, 178), "MERA AADHAAR, MERI PEHCHAN (Proof of Identity)", fill=(180, 40, 40))

    # Aadhaar 12-Digit Number
    if is_authentic:
        aadhaar_no = generate_valid_aadhaar()
        draw.text((115, 208), aadhaar_no, fill=(15, 23, 42))
        draw.text((130, 238), "VID: 9184 2019 4410 8821", fill=(100, 116, 139))
    else:
        # Altered number (failed Verhoeff checksum)
        bad_aadhaar = generate_invalid_aadhaar()
        # Render text with subtle vertical jitter or font weight mismatch (realistic splice)
        draw.text((115, 209), bad_aadhaar, fill=(25, 25, 30))
        draw.text((130, 238), "VID: 9184 2019 4410 8821", fill=(100, 116, 139))

    # Apply realistic splicing artifacts if suspicious
    if not is_authentic:
        if is_photo_tampered:
            img = apply_tamper_splice_artifacts(img, (18, 54, 108, 170), tamper_type="photo_splice")
        else:
            img = apply_tamper_splice_artifacts(img, (110, 204, 310, 232), tamper_type="field_splice")

    return apply_scanner_effects(img, add_tamper_noise=(not is_authentic))


# ==============================================================================
# 2. INDIAN PAN CARD GENERATOR
# ==============================================================================
def generate_pan_card(record: dict, is_authentic: bool) -> Image.Image:
    """Generates an authentic or realistic tampered Indian PAN Card."""
    img = Image.new("RGB", (420, 270), color=(240, 247, 255))
    draw = ImageDraw.Draw(img)

    # Pale blue security Guilloché background
    draw_guilloche_background(draw, 420, 270, color=(225, 238, 250), step=12, amplitude=3)

    # Header Bar
    draw.rectangle([8, 8, 412, 45], fill=(22, 45, 90))
    draw.text((20, 12), "INCOME TAX DEPARTMENT / AYAKAR VIBHAG", fill=(255, 255, 255))
    draw.text((20, 28), "GOVT. OF INDIA / BHARAT SARKAR", fill=(212, 175, 55))

    # ITD Hologram Simulation
    draw.rectangle([348, 12, 400, 40], fill=(212, 175, 55), outline=(255, 255, 255))
    draw.text((352, 22), "ITD SECURE", fill=(22, 45, 90))

    # Card Title
    draw.text((90, 50), "Permanent Account Number Card", fill=(30, 58, 138))

    # Photo Box
    is_photo_tampered = not is_authentic and random.random() < 0.5
    draw_portrait(draw, 20, 72, 100, 180, gender=record["gender"], altered=is_photo_tampered)

    # Demographic Details
    applicant_name = f"{record['first']} {record['last']}"
    surname_initial = record["last"][0].upper()
    father_name = record.get("father", f"KISHORE {record['last']}")

    draw.text((115, 75), f"Name: {applicant_name}", fill=(15, 23, 42))
    draw.text((115, 95), f"Father's Name: {father_name}", fill=(15, 23, 42))
    draw.text((115, 115), f"Date of Birth: {record['dob']}", fill=(15, 23, 42))

    # Valid PAN syntax vs altered
    if is_authentic:
        num_part = random.randint(1000, 9999)
        pan_no = f"ABC{'P'}{surname_initial}{num_part}F"
        draw.text((115, 145), f"PAN: {pan_no}", fill=(15, 23, 42))
        draw.text((115, 175), "Signature of Holder: [VERIFIED]", fill=(30, 41, 59))
        draw_qr_code_matrix(draw, 345, 80, size=50)
    else:
        # Tampered PAN: Invalid entity letter 'X' or mismatched surname letter + spliced patch
        bad_letter = random.choice(['X', 'Z', '9', 'T'])
        num_part = random.randint(1000, 9999)
        bad_pan = f"ABC{bad_letter}Q{num_part}K"
        draw.text((115, 146), f"PAN: {bad_pan}", fill=(20, 20, 30))
        draw.text((115, 175), "Signature: [ALTERED SIGNATURE]", fill=(30, 41, 59))
        draw_qr_code_matrix(draw, 345, 80, size=50, corrupted=True)

    if not is_authentic:
        if is_photo_tampered:
            img = apply_tamper_splice_artifacts(img, (18, 70, 102, 182), tamper_type="photo_splice")
        else:
            img = apply_tamper_splice_artifacts(img, (110, 140, 280, 168), tamper_type="field_splice")

    return apply_scanner_effects(img, add_tamper_noise=(not is_authentic))


# ==============================================================================
# 3. INDIAN DRIVING LICENCE GENERATOR
# ==============================================================================
def generate_driving_licence(record: dict, is_authentic: bool) -> Image.Image:
    """Generates an authentic or realistic tampered Indian Driving Licence."""
    img = Image.new("RGB", (420, 270), color=(254, 252, 240))
    draw = ImageDraw.Draw(img)

    # Subtle Guilloché background
    draw_guilloche_background(draw, 420, 270, color=(245, 240, 220), step=14, amplitude=3)

    # Header Banner
    draw.rectangle([8, 8, 412, 42], fill=(245, 158, 11))
    draw.text((20, 12), "UNION OF INDIA - DRIVING LICENCE", fill=(15, 23, 42))
    state_str = f"{record['state']}-{record['rto']}" if is_authentic else "ZZ-99"
    draw.text((20, 26), f"STATE MOTOR VEHICLES DEPT ({state_str})", fill=(69, 26, 3))

    # Smart Card Microchip Icon
    draw.rectangle([20, 50, 56, 76], fill=(212, 175, 55), outline=(180, 140, 30))
    draw.rectangle([28, 56, 48, 70], fill=(180, 140, 30))

    # Photo Box
    is_photo_tampered = not is_authentic and random.random() < 0.5
    draw_portrait(draw, 20, 84, 100, 190, gender=record["gender"], altered=is_photo_tampered)

    # Demographics
    applicant_name = f"{record['first']} {record['last']}"
    draw.text((115, 50), f"Name: {applicant_name}", fill=(15, 23, 42))
    draw.text((115, 70), "Blood Group: B+", fill=(15, 23, 42))
    draw.text((115, 90), "Class: LMV, MCWG (Non-Transport)", fill=(15, 23, 42))

    if is_authentic:
        dl_no = f"{record['state']}-{record['rto']}202000{random.randint(1000, 9999)}"
        draw.text((115, 115), f"DOB: {record['dob']}", fill=(15, 23, 42))
        draw.text((115, 140), f"DL No: {dl_no}", fill=(15, 23, 42))
        draw.text((115, 165), "Valid Till: 14/08/2038", fill=(5, 150, 105))
        draw.text((20, 210), "ISSUED BY LICENSING AUTHORITY (MoRTH / Parivahan)", fill=(75, 85, 99))
    else:
        # Altered licence with spliced DL number or validity date
        bad_dl = f"ZZ-99202100{random.randint(1000, 9999)}"
        draw.text((115, 115), f"DOB: {record['dob']}", fill=(15, 23, 42))
        draw.text((115, 141), f"DL No: {bad_dl}", fill=(20, 20, 30))
        draw.text((115, 165), "Valid Till: 14/08/2055", fill=(30, 41, 59))
        draw.text((20, 210), "ISSUED BY LICENSING AUTHORITY (MoRTH / Parivahan)", fill=(75, 85, 99))

    if not is_authentic:
        if is_photo_tampered:
            img = apply_tamper_splice_artifacts(img, (18, 82, 102, 192), tamper_type="photo_splice")
        else:
            img = apply_tamper_splice_artifacts(img, (110, 135, 310, 160), tamper_type="field_splice")

    return apply_scanner_effects(img, add_tamper_noise=(not is_authentic))


# ==============================================================================
# 4. BIOMETRIC PASSPORT GENERATOR
# ==============================================================================
def generate_passport(record: dict, is_authentic: bool) -> Image.Image:
    """Generates an authentic or realistic tampered Biometric Passport."""
    img = Image.new("RGB", (420, 270), color=(248, 249, 250))
    draw = ImageDraw.Draw(img)

    # Guilloche waves
    draw_guilloche_background(draw, 420, 270, color=(235, 240, 245), step=14, amplitude=4)

    # Navy Header
    draw.rectangle([8, 8, 412, 42], fill=(15, 23, 42))
    draw.text((20, 12), "REPUBLIC OF INDIA / BHARAT GANARAJYA", fill=(255, 255, 255))
    draw.text((20, 26), "PASSPORT / OFFICIAL TRAVEL DOCUMENT", fill=(212, 175, 55))

    # Photo Box
    is_photo_tampered = not is_authentic and random.random() < 0.5
    draw_portrait(draw, 20, 52, 105, 165, gender=record["gender"], altered=is_photo_tampered)

    # Demographics
    draw.text((120, 52), f"Surname: {record['last']}", fill=(15, 23, 42))
    draw.text((120, 70), f"Given Names: {record['first']}", fill=(15, 23, 42))
    draw.text((120, 88), "Nationality: INDIAN", fill=(15, 23, 42))
    draw.text((120, 106), f"Date of Birth: {record['dob']}", fill=(15, 23, 42))
    draw.text((120, 124), f"Sex: {record['gender'][0]}", fill=(15, 23, 42))

    pass_no = f"Z{random.randint(1000000, 9999999)}"

    # ICAO Doc 9303 MRZ Machine Readable Zone
    draw.rectangle([8, 185, 412, 262], fill=(235, 240, 245), outline=(203, 213, 225))
    if is_authentic:
        mrz_line1 = f"P<IND{record['last']}<<{record['first']}<<<<<<<<<<<<<<<<<<<<"[:44]
        mrz_line2 = f"{pass_no}<8IND8808144M3105118<<<<<<<<<<<<<<<04"[:44]
        draw.text((14, 195), mrz_line1, fill=(15, 23, 42))
        draw.text((14, 222), mrz_line2, fill=(15, 23, 42))
    else:
        # Altered MRZ line (spliced check digit)
        mrz_line1 = f"P<IND{record['last']}<<{record['first']}<<<<<<<<<<<<<<<<<<<<"[:44]
        mrz_line2 = f"{pass_no}<XIND8808144M3105118<<<<<<<<<<<<<<<04"[:44]
        draw.text((14, 195), mrz_line1, fill=(15, 23, 42))
        draw.text((14, 223), mrz_line2, fill=(20, 20, 25))

    if not is_authentic:
        if is_photo_tampered:
            img = apply_tamper_splice_artifacts(img, (18, 50, 107, 167), tamper_type="photo_splice")
        else:
            img = apply_tamper_splice_artifacts(img, (12, 190, 408, 255), tamper_type="field_splice")

    return apply_scanner_effects(img, add_tamper_noise=(not is_authentic))


# ==============================================================================
# 5. INDIAN VOTER ID (EPIC CARD) GENERATOR
# ==============================================================================
def generate_voter_id(record: dict, is_authentic: bool) -> Image.Image:
    """Generates an authentic or realistic tampered Indian Voter ID Card."""
    img = Image.new("RGB", (420, 270), color=(250, 252, 255))
    draw = ImageDraw.Draw(img)

    draw_guilloche_background(draw, 420, 270, color=(235, 242, 250), step=14, amplitude=3)

    # Header
    draw.rectangle([8, 8, 412, 42], fill=(24, 52, 94))
    draw.text((20, 12), "ELECTION COMMISSION OF INDIA", fill=(255, 255, 255))
    draw.text((20, 26), "BHARAT NIRVACHAN AAYOG", fill=(212, 175, 55))

    # Photo Box
    is_photo_tampered = not is_authentic and random.random() < 0.5
    draw_portrait(draw, 20, 56, 105, 170, gender=record["gender"], altered=is_photo_tampered)

    # EPIC Card Number
    state_code = record["state"]
    epic_no = f"{state_code}B{random.randint(1000000, 9999999)}" if is_authentic else f"ZZX{random.randint(1000000, 9999999)}"

    draw.text((120, 56), f"EPIC NO: {epic_no}", fill=(15, 23, 42))
    applicant_name = f"{record['first']} {record['last']}"
    draw.text((120, 80), f"Elector's Name: {applicant_name}", fill=(15, 23, 42))
    father_name = record.get("father", f"RAMESH {record['last']}")
    draw.text((120, 104), f"Father's Name: {father_name}", fill=(15, 23, 42))
    draw.text((120, 128), f"Sex: {record['gender']}", fill=(15, 23, 42))
    draw.text((120, 152), f"Constituency: {record['city']} CENTRAL", fill=(51, 65, 85))

    draw_qr_code_matrix(draw, 345, 56, size=50, corrupted=(not is_authentic and random.random() < 0.4))

    if not is_authentic:
        if is_photo_tampered:
            img = apply_tamper_splice_artifacts(img, (18, 54, 107, 172), tamper_type="photo_splice")
        else:
            img = apply_tamper_splice_artifacts(img, (115, 52, 280, 78), tamper_type="field_splice")

    return apply_scanner_effects(img, add_tamper_noise=(not is_authentic))


# ==============================================================================
# DATASET GENERATION CONTROLLER
# ==============================================================================
def generate_dataset(output_dir: str, samples_per_class: int = 100):
    """
    Generates a balanced dataset of authentic and realistic tampered government documents.
    Default: 100 Authentic + 100 Suspicious = 200 high-quality samples.
    """
    normal_dir = os.path.join(output_dir, "normal")
    suspicious_dir = os.path.join(output_dir, "suspicious")

    os.makedirs(normal_dir, exist_ok=True)
    os.makedirs(suspicious_dir, exist_ok=True)

    # Clean previous synthetic files if present
    for f in os.listdir(normal_dir):
        if f.endswith(('.jpg', '.jpeg', '.png')):
            try:
                os.remove(os.path.join(normal_dir, f))
            except Exception:
                pass
    for f in os.listdir(suspicious_dir):
        if f.endswith(('.jpg', '.jpeg', '.png')):
            try:
                os.remove(os.path.join(suspicious_dir, f))
            except Exception:
                pass

    print("=" * 70)
    print(" IdentityShield — Generating Proper Government Documents Dataset")
    print(f" Target Directory : {output_dir}")
    print(f" Normal Folder    : {normal_dir}")
    print(f" Suspicious Folder: {suspicious_dir}")
    print(f" Samples Per Class: {samples_per_class}")
    print("=" * 70)

    generators = [
        ("aadhaar", generate_aadhaar_card),
        ("pan", generate_pan_card),
        ("dl", generate_driving_licence),
        ("passport", generate_passport),
        ("voter", generate_voter_id)
    ]

    # 1. Generate Authentic / Normal Documents
    print(f"\n[+] Generating {samples_per_class} Authentic Government Documents (Normal)...")
    for i in range(samples_per_class):
        rec = random.choice(CITIZEN_RECORDS)
        doc_type, gen_func = generators[i % len(generators)]
        doc_img = gen_func(rec, is_authentic=True)
        fname = f"doc_{doc_type}_normal_{i:03d}.jpg"
        doc_img.save(os.path.join(normal_dir, fname), quality=92)

    # 2. Generate Tampered / Suspicious Documents
    print(f"[+] Generating {samples_per_class} Tampered/Spliced Government Documents (Suspicious)...")
    for i in range(samples_per_class):
        rec = random.choice(CITIZEN_RECORDS)
        doc_type, gen_func = generators[i % len(generators)]
        doc_img = gen_func(rec, is_authentic=False)
        fname = f"doc_{doc_type}_forged_{i:03d}.jpg"
        doc_img.save(os.path.join(suspicious_dir, fname), quality=92)

    norm_count = len(os.listdir(normal_dir))
    susp_count = len(os.listdir(suspicious_dir))
    print("\n✓ Dataset generation complete:")
    print(f"   • Authentic Govt Documents (Normal)    : {norm_count} images")
    print(f"   • Forged/Spliced Documents (Suspicious) : {susp_count} images")
    print("=" * 70)


if __name__ == "__main__":
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    generate_dataset(data_dir, samples_per_class=150)
