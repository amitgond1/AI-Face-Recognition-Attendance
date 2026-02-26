# main.py - FastAPI AI Server Entry Point
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import logging
import os

# Local modules
from register import register_face, delete_face, load_embeddings
from recognition import recognize_face, get_embedding_stats

# ── Logging Setup ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s — %(name)s — %(levelname)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ── FastAPI App ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="FaceAttend AI Server",
    description="Deep Learning Face Recognition API using DeepFace (Facenet512)",
    version="1.0.0",
)

# Allow requests from React frontend and Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request / Response Models ──────────────────────────────────────────────────

class RegisterFaceRequest(BaseModel):
    image: str                     # Base64-encoded image
    student_id: str
    student_name: str

class RecognizeRequest(BaseModel):
    image: str                     # Base64-encoded image

class RegisterFaceResponse(BaseModel):
    success: bool
    message: str
    embedding: Optional[list] = None
    image_path: Optional[str] = None
    quality: Optional[dict] = None

class RecognizeResponse(BaseModel):
    success: bool
    recognized: bool
    name: Optional[str] = None
    studentId: Optional[str] = None
    confidence: Optional[float] = None
    faces: Optional[list] = None
    faceCount: Optional[int] = None
    quality: Optional[dict] = None
    mask_info: Optional[dict] = None
    message: Optional[str] = None

# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    """Health check endpoint."""
    stats = get_embedding_stats()
    return {
        "status": "ok",
        "server": "FaceAttend AI Server",
        "model": "Facenet512 (DeepFace)",
        "registered_faces": stats["total_embeddings"],
    }


@app.post("/register_face", response_model=RegisterFaceResponse)
async def api_register_face(request: RegisterFaceRequest):
    """
    Register a student's face.
    - Input: base64 image, student_id, student_name
    - Output: success flag, embedding vector, image path
    """
    logger.info(f"📝 Registering face for: {request.student_name} ({request.student_id})")

    result = register_face(
        image_base64=request.image,
        student_id=request.student_id,
        student_name=request.student_name,
    )

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])

    return result


@app.post("/recognize", response_model=RecognizeResponse)
async def api_recognize_face(request: RecognizeRequest):
    """
    Recognize face(s) in an image.
    - Input: base64 image
    - Output: name, studentId, confidence, face list, quality info
    """
    result = recognize_face(image_base64=request.image)

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("message", "Recognition failed"))

    return result


@app.delete("/delete_face/{student_id}")
async def api_delete_face(student_id: str):
    """Delete a student's face data from the recognition database."""
    logger.info(f"🗑️  Deleting face data for student: {student_id}")
    result = delete_face(student_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.get("/embeddings/stats")
async def api_embedding_stats():
    """Get statistics about stored face embeddings."""
    return get_embedding_stats()


@app.get("/embeddings/list")
async def api_list_embeddings():
    """List all registered students in the face database."""
    stored = load_embeddings()
    students = [
        {"student_id": k, "name": v["name"]}
        for k, v in stored.items()
    ]
    return {"success": True, "count": len(students), "students": students}


# ── App Startup ────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Initialize face database directory on startup."""
    face_db_path = os.path.join(os.path.dirname(__file__), "face_db")
    os.makedirs(face_db_path, exist_ok=True)
    stats = get_embedding_stats()
    logger.info(f"🚀 FaceAttend AI Server started")
    logger.info(f"🧠 Model: Facenet512 | Registered faces: {stats['total_embeddings']}")


# ── Run ────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
