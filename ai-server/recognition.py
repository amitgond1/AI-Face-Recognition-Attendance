# recognition.py - Real-Time Face Recognition using DeepFace
import os
import cv2
import numpy as np
from deepface import DeepFace
from register import load_embeddings, FACE_DB_PATH, MODEL_NAME
from utils import (
    base64_to_numpy, check_image_quality,
    cosine_similarity, confidence_from_distance,
)
import logging

logger = logging.getLogger(__name__)

# Recognition threshold — distance below this counts as a match
RECOGNITION_THRESHOLD = 0.60

# Anti-spoofing (real vs. photo detection) — requires silent-face-anti-spoofing
ANTI_SPOOFING_ENABLED = False  # Set True if you have anti-spoofing model installed

# Minimum confidence to accept a match (%)
MIN_CONFIDENCE = 55.0


def check_face_mask(img: np.ndarray) -> dict:
    """
    Simple mask detection using OpenCV color + region analysis.
    Returns: { has_mask, confidence }
    """
    try:
        # Convert to HSV for color analysis
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

        # Detect white/light-gray color regions (typical surgical mask)
        lower_white = np.array([0, 0, 150])
        upper_white = np.array([180, 60, 255])
        mask_region = cv2.inRange(hsv, lower_white, upper_white)

        h, w = img.shape[:2]
        # Check lower face region (nose/mouth area)
        lower_face = mask_region[h // 2:, w // 4: 3 * w // 4]
        mask_coverage = np.sum(lower_face > 0) / (lower_face.size + 1e-5)

        has_mask = mask_coverage > 0.35
        return {"has_mask": has_mask, "mask_coverage": round(float(mask_coverage), 3)}
    except Exception as e:
        return {"has_mask": False, "mask_coverage": 0.0}


def recognize_face(image_base64: str) -> dict:
    """
    Recognize a face from a base64-encoded image.
    Steps:
    1. Decode image
    2. Quality check
    3. Mask detection
    4. Detect faces with DeepFace
    5. Compare embeddings against stored database
    6. Return top match with confidence score
    Returns: { success, recognized, name, studentId, confidence, faces, message, quality, mask_info }
    """
    try:
        img = base64_to_numpy(image_base64)
        if img is None:
            return {"success": False, "message": "Could not decode image"}

        # ── Quality Check ──────────────────────────────────────────────────────
        quality = check_image_quality(img)
        if not quality["passed"]:
            reasons = []
            if quality["is_blurry"]:
                reasons.append("blurry")
            if quality["is_dark"]:
                reasons.append("too dark")
            if quality["is_overexposed"]:
                reasons.append("overexposed")
            return {
                "success": True,
                "recognized": False,
                "message": f"Low quality image: {', '.join(reasons)}",
                "quality": quality,
                "faces": [],
            }

        # ── Mask Detection ─────────────────────────────────────────────────────
        mask_info = check_face_mask(img)

        # ── Load stored embeddings ─────────────────────────────────────────────
        stored = load_embeddings()
        if not stored:
            return {
                "success": True,
                "recognized": False,
                "message": "No faces registered in database",
                "faces": [],
                "quality": quality,
                "mask_info": mask_info,
            }

        # ── Extract embedding from received image ──────────────────────────────
        try:
            embedding_objs = DeepFace.represent(
                img_path=img,
                model_name=MODEL_NAME,
                detector_backend="retinaface",
                enforce_detection=True,
            )
        except Exception:
            # Fallback: less strict detection
            try:
                embedding_objs = DeepFace.represent(
                    img_path=img,
                    model_name=MODEL_NAME,
                    detector_backend="opencv",
                    enforce_detection=False,
                )
            except Exception as e2:
                return {
                    "success": True,
                    "recognized": False,
                    "message": "No face detected in frame",
                    "quality": quality,
                    "mask_info": mask_info,
                    "faces": [],
                }

        if not embedding_objs:
            return {
                "success": True,
                "recognized": False,
                "message": "No face detected",
                "quality": quality,
                "mask_info": mask_info,
                "faces": [],
            }

        # ── Match against stored embeddings ───────────────────────────────────
        results = []
        for embedding_obj in embedding_objs:
            query_embedding = embedding_obj["embedding"]
            facial_area = embedding_obj.get("facial_area", {})

            best_match = None
            best_distance = float('inf')
            best_student_id = None
            best_name = None

            for sid, data in stored.items():
                stored_emb = data["embedding"]
                # Cosine distance = 1 - cosine_similarity
                sim = cosine_similarity(query_embedding, stored_emb)
                dist = 1.0 - sim

                if dist < best_distance:
                    best_distance = dist
                    best_match = data
                    best_student_id = sid
                    best_name = data["name"]

            confidence = confidence_from_distance(best_distance, RECOGNITION_THRESHOLD)

            if best_distance < RECOGNITION_THRESHOLD and confidence >= MIN_CONFIDENCE:
                results.append({
                    "recognized": True,
                    "name": best_name,
                    "studentId": best_student_id,
                    "confidence": round(confidence, 1),
                    "distance": round(best_distance, 4),
                    "facial_area": facial_area,
                })
            else:
                results.append({
                    "recognized": False,
                    "name": "Unknown",
                    "studentId": None,
                    "confidence": round(confidence, 1),
                    "distance": round(best_distance, 4),
                    "facial_area": facial_area,
                })

        # Primary result = best recognized face
        recognized_results = [r for r in results if r["recognized"]]
        primary = recognized_results[0] if recognized_results else (results[0] if results else None)

        return {
            "success": True,
            "recognized": bool(recognized_results),
            "name": primary["name"] if primary else "Unknown",
            "studentId": primary["studentId"] if primary else None,
            "confidence": primary["confidence"] if primary else 0.0,
            "faces": results,
            "faceCount": len(results),
            "quality": quality,
            "mask_info": mask_info,
            "message": f"Recognized {len(recognized_results)} of {len(results)} face(s)",
        }

    except Exception as e:
        logger.error(f"Recognition error: {str(e)}")
        return {"success": False, "message": str(e)}


def get_embedding_stats() -> dict:
    """Return stats about the stored face embedding database."""
    stored = load_embeddings()
    return {
        "total_embeddings": len(stored),
        "students": [
            {"studentId": k, "name": v["name"]} for k, v in stored.items()
        ],
    }
