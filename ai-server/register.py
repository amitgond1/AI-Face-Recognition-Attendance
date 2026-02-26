# register.py - Face Registration using DeepFace
import os
import cv2
import json
import numpy as np
from deepface import DeepFace
from utils import (
    base64_to_numpy, save_image, check_image_quality,
)
import logging

logger = logging.getLogger(__name__)

# Path where face images for recognition database are stored
FACE_DB_PATH = os.path.join(os.path.dirname(__file__), "face_db")
EMBEDDINGS_FILE = os.path.join(os.path.dirname(__file__), "embeddings.json")

# DeepFace model to use (Facenet512 is best balance of speed / accuracy)
MODEL_NAME = "Facenet512"
DETECTOR = "retinaface"  # or 'mtcnn' for slower but more accurate


def load_embeddings() -> dict:
    """Load all stored face embeddings from JSON file."""
    if os.path.exists(EMBEDDINGS_FILE):
        with open(EMBEDDINGS_FILE, 'r') as f:
            return json.load(f)
    return {}


def save_embeddings(data: dict):
    """Persist embeddings dict to JSON file."""
    with open(EMBEDDINGS_FILE, 'w') as f:
        json.dump(data, f)


def register_face(
    image_base64: str,
    student_id: str,
    student_name: str,
) -> dict:
    """
    Register a student's face:
    1. Decode image
    2. Quality check
    3. Generate DeepFace embedding (Facenet512)
    4. Save image to face_db/<student_id>/
    5. Save embedding to embeddings.json
    Returns: { success, embedding, image_path, message }
    """
    try:
        img = base64_to_numpy(image_base64)
        if img is None:
            return {"success": False, "message": "Could not decode image"}

        # Quality check
        quality = check_image_quality(img)
        if not quality["passed"]:
            reasons = []
            if quality["is_blurry"]:
                reasons.append("Image is too blurry")
            if quality["is_dark"]:
                reasons.append("Image is too dark")
            if quality["is_overexposed"]:
                reasons.append("Image is overexposed")
            return {"success": False, "message": "; ".join(reasons), "quality": quality}

        # Save image to face_db folder (DeepFace uses folder-based database)
        student_folder = os.path.join(FACE_DB_PATH, student_id)
        os.makedirs(student_folder, exist_ok=True)
        image_filename = f"{student_id}.jpg"
        image_path = os.path.join(student_folder, image_filename)
        cv2.imwrite(image_path, img)

        # Generate face embedding using DeepFace
        try:
            embedding_objs = DeepFace.represent(
                img_path=img,
                model_name=MODEL_NAME,
                detector_backend=DETECTOR,
                enforce_detection=True,
            )
        except Exception as e:
            # Try with enforce_detection=False as fallback
            try:
                embedding_objs = DeepFace.represent(
                    img_path=img,
                    model_name=MODEL_NAME,
                    detector_backend="opencv",
                    enforce_detection=False,
                )
            except Exception as e2:
                return {"success": False, "message": f"No face detected in image: {str(e2)}"}

        if not embedding_objs:
            return {"success": False, "message": "No face detected in image"}

        embedding = embedding_objs[0]["embedding"]

        # Save to embeddings store
        embeddings = load_embeddings()
        embeddings[student_id] = {
            "name": student_name,
            "student_id": student_id,
            "embedding": embedding,
            "image_path": image_path,
        }
        save_embeddings(embeddings)

        logger.info(f"✅ Face registered for student: {student_name} ({student_id})")
        return {
            "success": True,
            "message": f"Face registered successfully for {student_name}",
            "embedding": embedding,
            "image_path": image_path.replace("\\", "/"),
            "quality": quality,
        }

    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return {"success": False, "message": str(e)}


def delete_face(student_id: str) -> dict:
    """Delete a student's face data from the database."""
    try:
        embeddings = load_embeddings()
        if student_id in embeddings:
            del embeddings[student_id]
            save_embeddings(embeddings)

        # Remove image folder
        student_folder = os.path.join(FACE_DB_PATH, student_id)
        if os.path.exists(student_folder):
            import shutil
            shutil.rmtree(student_folder)

        return {"success": True, "message": f"Face data deleted for student {student_id}"}
    except Exception as e:
        return {"success": False, "message": str(e)}
