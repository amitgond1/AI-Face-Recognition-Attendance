# 🎭 FaceAttend — AI Face Recognition Attendance System

A production-ready, three-tier attendance management system powered by **DeepFace (Facenet512)** deep learning for real-time face recognition.

---

## 🏗️ Architecture

```
┌─────────────────────┐    ┌──────────────────────┐    ┌────────────────────────┐
│   React Frontend    │◄──►│  Node.js Backend      │◄──►│   Python AI Server     │
│   Vite + Tailwind   │    │  Express + MongoDB    │    │   FastAPI + DeepFace   │
│   Port: 5173        │    │  Port: 5000           │    │   Port: 8000           │
└─────────────────────┘    └──────────────────────┘    └────────────────────────┘
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** 18+ and npm 9+
- **Python** 3.9+ and pip
- **MongoDB** running locally or Atlas URI

---

### 1. 🗄️ MongoDB Setup

**Option A — Local:**

```bash
# Install MongoDB Community and start
mongod --dbpath /data/db
```

**Option B — Atlas (Cloud):**

1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Copy your connection URI

---

### 2. 🔧 Backend Setup

```bash
cd backend
npm install
```

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/face-attendance  # or your Atlas URI
JWT_SECRET=your_super_secret_key_here
AI_SERVER_URL=http://localhost:8000
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password       # Gmail App Password (16 chars)
```

Start backend:

```bash
npm run dev
```

---

### 3. 🐍 Python AI Server Setup

```bash
cd ai-server
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

> ⚠️ **First run**: DeepFace will download the Facenet512 model (~500MB). This happens once automatically.

Start AI server:

```bash
python main.py
# OR
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

### 4. ⚛️ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open: **http://localhost:5173**

---

## 📁 Project Structure

```
face-attendance-system/
├── frontend/                    # React + Vite + Tailwind
│   └── src/
│       ├── api/index.js         # Axios API client
│       ├── context/AuthContext  # JWT auth state
│       ├── components/          # Layout, Sidebar
│       └── pages/               # All page components
│           ├── Login.jsx
│           ├── Dashboard.jsx    # Stats + Charts
│           ├── LiveRecognition  # Real-time webcam
│           ├── RegisterFace     # Student registration
│           ├── AttendancePage   # Full attendance table
│           ├── AdminPanel       # CRUD interface
│           ├── StudentProfile   # Profile + Calendar
│           ├── Reports.jsx      # Export reports
│           └── Logs.jsx         # Recognition logs
│
├── backend/                     # Node.js + Express
│   ├── models/
│   │   ├── Admin.js             # Admin schema
│   │   ├── Student.js           # Student + embedding
│   │   └── Attendance.js        # Attendance records
│   ├── controllers/             # Business logic
│   ├── routes/                  # API routes
│   └── config/                  # DB + Email config
│
└── ai-server/                   # Python FastAPI
    ├── main.py                  # FastAPI app
    ├── register.py              # Face registration
    ├── recognition.py           # Face recognition
    ├── utils.py                 # Image utilities
    ├── face_db/                 # Face images database
    └── embeddings.json          # Stored embeddings
```

---

## 🌐 API Reference

### Auth

| Method | URL                | Description       |
| ------ | ------------------ | ----------------- |
| POST   | `/api/auth/signup` | Register admin    |
| POST   | `/api/auth/login`  | Login → JWT token |

### Students

| Method | URL                 | Description             |
| ------ | ------------------- | ----------------------- |
| POST   | `/api/students`     | Add + register face     |
| GET    | `/api/students`     | List all students       |
| GET    | `/api/students/:id` | Student details + stats |
| PUT    | `/api/students/:id` | Update student          |
| DELETE | `/api/students/:id` | Delete student          |

### Attendance

| Method | URL                           | Description                     |
| ------ | ----------------------------- | ------------------------------- |
| POST   | `/api/attendance`             | Mark attendance (no duplicates) |
| GET    | `/api/attendance`             | Get all (with filters)          |
| GET    | `/api/attendance/stats/today` | Today's dashboard stats         |
| GET    | `/api/attendance/chart-data`  | Chart data                      |
| GET    | `/api/attendance/student/:id` | Student history                 |

### Reports & Export

| Method | URL                         | Description    |
| ------ | --------------------------- | -------------- |
| GET    | `/api/reports/export/csv`   | Download CSV   |
| GET    | `/api/reports/export/excel` | Download Excel |
| GET    | `/api/reports/export/pdf`   | Download PDF   |

### AI Server (Port 8000)

| Method | URL                 | Description             |
| ------ | ------------------- | ----------------------- |
| POST   | `/register_face`    | Generate face embedding |
| POST   | `/recognize`        | Recognize face          |
| DELETE | `/delete_face/:id`  | Remove face data        |
| GET    | `/embeddings/stats` | Embedding count         |
| GET    | `/health`           | Server health           |

---

## 🎯 Features

| Feature                             | Status |
| ----------------------------------- | ------ |
| JWT Authentication                  | ✅     |
| DeepFace Facenet512 Recognition     | ✅     |
| Face Registration (webcam + upload) | ✅     |
| Real-Time Recognition + FPS Counter | ✅     |
| Auto Attendance Marking             | ✅     |
| Duplicate Prevention (same day)     | ✅     |
| Email Notifications (Nodemailer)    | ✅     |
| Multi-Camera Support                | ✅     |
| Unknown Face Detection              | ✅     |
| Face Quality Check                  | ✅     |
| Face Mask Detection                 | ✅     |
| Auto-Stop at Configured Time        | ✅     |
| Glassmorphism UI (dark theme)       | ✅     |
| Recharts Analytics                  | ✅     |
| CSV / Excel / PDF Export            | ✅     |
| Calendar Attendance View            | ✅     |
| Student Profile Pages               | ✅     |
| Framer Motion Animations            | ✅     |
| Mobile Responsive                   | ✅     |
| Admin CRUD Panel                    | ✅     |

---

## 🔧 Environment Variables

### Backend `.env`

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/face-attendance
JWT_SECRET=your_jwt_secret
AI_SERVER_URL=http://localhost:8000
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

> 💡 To get a Gmail App Password: Google Account → Security → 2-Step Verification → App passwords

---

## 🤖 AI Model Details

- **Model**: Facenet512 (via DeepFace)
- **Face Detector**: RetinaFace (fallback: OpenCV)
- **Embedding Size**: 512 dimensions
- **Similarity Metric**: Cosine Similarity
- **Recognition Threshold**: 0.60 distance (~60% confidence minimum)
- **Quality Checks**: Blur (Laplacian variance), Brightness

---

## 📝 Notes

1. The AI server takes ~30s to load on first request (model initialization)
2. For best recognition accuracy, register faces in the same lighting conditions as usage
3. The anti-spoofing module requires additional setup (see DeepFace docs)
4. PDF export uses pdfkit for server-side rendering
