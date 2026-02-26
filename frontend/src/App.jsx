// src/App.jsx - App Router
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import RegisterFace from './pages/RegisterFace';
import LiveRecognition from './pages/LiveRecognition';
import AttendancePage from './pages/AttendancePage';
import StudentProfile from './pages/StudentProfile';
import Reports from './pages/Reports';
import Logs from './pages/Logs';
import AdminPanel from './pages/AdminPanel';
import StudentKiosk from './pages/StudentKiosk';

// Protected Route wrapper
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-dark)' }}>
        <div className="text-center">
          <div className="text-4xl mb-4">🎭</div>
          <div className="gradient-text text-xl font-bold">FaceAttend</div>
          <div className="flex gap-1 justify-center mt-4">
            <span className="dot-1 text-2xl text-indigo-400">•</span>
            <span className="dot-2 text-2xl text-cyan-400">•</span>
            <span className="dot-3 text-2xl text-purple-400">•</span>
          </div>
        </div>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes inside Layout */}
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="register-face" element={<RegisterFace />} />
          <Route path="live" element={<LiveRecognition />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="students/:id" element={<StudentProfile />} />
          <Route path="reports" element={<Reports />} />
          <Route path="logs" element={<Logs />} />
          <Route path="admin" element={<AdminPanel />} />
        </Route>

        {/* Public Standalone Route for Student Kiosk (No Login Required) */}
        <Route path="/student-attendance" element={<StudentKiosk />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
