# utils.py - Helper Utilities for AI Server
import base64
import numpy as np
import cv2
from PIL import Image
import io
import os
import logging

logger = logging.getLogger(__name__)


def base64_to_numpy(base64_str: str) -> np.ndarray:
    """
    Decode a base64 image string to a numpy array (BGR format for OpenCV).
    Strips data URI prefix if present.
    """
    # Strip data URI prefix if present (e.g. "data:image/jpeg;base64,...")
    if ',' in base64_str:
        base64_str = base64_str.split(',', 1)[1]

    img_bytes = base64.b64decode(base64_str)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img


def numpy_to_base64(img: np.ndarray) -> str:
    """Encode numpy (BGR) image to base64 JPEG string."""
    _, buffer = cv2.imencode('.jpg', img)
    return base64.b64encode(buffer).decode('utf-8')


def save_image(img: np.ndarray, save_path: str) -> str:
    """Save a numpy image to disk. Returns the saved path."""
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    cv2.imwrite(save_path, img)
    return save_path


def check_image_quality(img: np.ndarray) -> dict:
    """
    Quality check:
    - Blur: Laplacian variance < threshold → blurry
    - Brightness: mean pixel value
    Returns dict with quality info.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Blur detection via Laplacian
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    is_blurry = laplacian_var < 80.0

    # Brightness check
    brightness = gray.mean()
    is_dark = brightness < 40
    is_overexposed = brightness > 220

    quality_score = min(100, max(0, int(laplacian_var / 2)))

    return {
        "is_blurry": is_blurry,
        "is_dark": is_dark,
        "is_overexposed": is_overexposed,
        "sharpness_score": round(laplacian_var, 2),
        "brightness": round(float(brightness), 2),
        "quality_score": quality_score,
        "passed": not is_blurry and not is_dark and not is_overexposed,
    }


def cosine_similarity(vec1: list, vec2: list) -> float:
    """
    Compute cosine similarity between two embedding vectors.
    Returns value between -1 and 1 (1 = identical).
    """
    a = np.array(vec1)
    b = np.array(vec2)
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def euclidean_distance(vec1: list, vec2: list) -> float:
    """Compute Euclidean distance between two embedding vectors."""
    a = np.array(vec1)
    b = np.array(vec2)
    return float(np.linalg.norm(a - b))


def confidence_from_distance(distance: float, threshold: float = 0.60) -> float:
    """
    Convert embedding distance to a confidence percentage (0-100%).
    Lower distance = higher confidence.
    """
    if distance <= 0:
        return 100.0
    confidence = max(0.0, (1.0 - (distance / threshold)) * 100.0)
    return round(confidence, 2)
