// src/pages/RegisterFace.jsx - Student Face Registration
import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import { studentAPI } from '../api';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Business', 'Mathematics', 'Physics', 'Chemistry'];

export default function RegisterFace() {
  const [form, setForm] = useState({ name: '', studentId: '', department: '', email: '', phone: '' });
  const [captureMode, setCaptureMode] = useState('webcam'); // 'webcam' | 'upload'
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const webcamRef = useRef(null);

  const capturePhoto = useCallback(() => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) {
      setCapturedImage(screenshot);
      toast.success('📸 Photo captured!');
    }
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCapturedImage(ev.target.result);
      toast.success('📁 Image loaded!');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!capturedImage) {
      toast.error('Please capture or upload a face image');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, imageBase64: capturedImage };
      const res = await studentAPI.create(payload);
      toast.success(res.data.message || 'Student registered successfully! 🎉');
      setForm({ name: '', studentId: '', department: '', email: '', phone: '' });
      setCapturedImage(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Register Student</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Add a new student with face registration</p>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Left: Form Fields */}
          <motion.div
            className="glass"
            style={{ padding: 28 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>👤 Student Information</h3>

            <div style={{ marginBottom: 18 }}>
              <label className="input-label">Full Name *</label>
              <input className="input-field" placeholder="e.g. Amit Kumar" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="input-label">Student ID *</label>
              <input className="input-field" placeholder="e.g. CS2024001" value={form.studentId}
                onChange={e => setForm({ ...form, studentId: e.target.value })} required />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="input-label">Department *</label>
              <select className="input-field" value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })} required
                style={{ cursor: 'pointer' }}>
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="input-label">Email *</label>
              <input type="email" className="input-field" placeholder="student@school.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="input-label">Phone</label>
              <input type="tel" className="input-field" placeholder="+91 9876543210" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>

            <motion.button type="submit" className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15 }}
              disabled={loading} whileTap={{ scale: 0.98 }}>
              {loading ? (
                <span className="flex items-center gap-2">
                  Registering<span className="dot-1">•</span><span className="dot-2">•</span><span className="dot-3">•</span>
                </span>
              ) : '✅ Register Student'}
            </motion.button>
          </motion.div>

          {/* Right: Camera / Upload */}
          <motion.div
            className="glass"
            style={{ padding: 28 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📸 Face Capture</h3>

            {/* Mode Toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {['webcam', 'upload'].map(m => (
                <button key={m} type="button"
                  onClick={() => { setCaptureMode(m); setCapturedImage(null); }}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 10, border: 'none',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: captureMode === m ? 'rgba(79,70,229,0.3)' : 'rgba(255,255,255,0.05)',
                    color: captureMode === m ? '#A5B4FC' : 'var(--text-secondary)',
                    transition: 'all 0.2s',
                  }}>
                  {m === 'webcam' ? '📹 Webcam' : '📁 Upload'}
                </button>
              ))}
            </div>

            {capturedImage ? (
              /* Preview captured image */
              <div style={{ textAlign: 'center' }}>
                <img src={capturedImage} alt="Captured"
                  style={{ width: '100%', borderRadius: 12, border: '2px solid rgba(79,70,229,0.4)', maxHeight: 280, objectFit: 'cover' }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setCapturedImage(null)}>↩️ Retake</button>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 12, color: '#10B981', fontWeight: 600, fontSize: 14 }}>
                    ✅ Ready
                  </div>
                </div>
              </div>
            ) : captureMode === 'webcam' ? (
              /* Webcam View */
              <div>
                <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', minHeight: 240 }}>
                  <Webcam ref={webcamRef} screenshotFormat="image/jpeg" width="100%"
                    onUserMedia={() => setCameraReady(true)}
                    onUserMediaError={() => toast.error('Camera not accessible')}
                    style={{ display: 'block', borderRadius: 12 }} />
                  {!cameraReady && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.7)', color: 'var(--text-secondary)' }}>
                      📹 Initializing camera...
                    </div>
                  )}
                  {/* Corner markers */}
                  {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => (
                    <div key={pos} style={{
                      position: 'absolute',
                      top: pos.includes('top') ? 16 : 'auto',
                      bottom: pos.includes('bottom') ? 16 : 'auto',
                      left: pos.includes('left') ? 16 : 'auto',
                      right: pos.includes('right') ? 16 : 'auto',
                      width: 20, height: 20,
                      borderTop: pos.includes('top') ? '3px solid #4F46E5' : 'none',
                      borderBottom: pos.includes('bottom') ? '3px solid #4F46E5' : 'none',
                      borderLeft: pos.includes('left') ? '3px solid #4F46E5' : 'none',
                      borderRight: pos.includes('right') ? '3px solid #4F46E5' : 'none',
                    }} />
                  ))}
                </div>
                <motion.button type="button" className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '12px' }}
                  onClick={capturePhoto} whileTap={{ scale: 0.95 }}>
                  📸 Capture Photo
                </motion.button>
              </div>
            ) : (
              /* Upload View */
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: 280, border: '2px dashed rgba(79,70,229,0.4)', borderRadius: 12,
                cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s',
              }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(79,70,229,0.8)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(79,70,229,0.4)'}>
                <span style={{ fontSize: 48 }}>📁</span>
                <span style={{ marginTop: 12, fontWeight: 500 }}>Click to upload face image</span>
                <span style={{ fontSize: 12, marginTop: 4 }}>JPG, PNG (max 10MB)</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            )}

            <div className="glass" style={{ padding: 14, marginTop: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                💡 Tips for best results:<br />
                • Face the camera directly<br />
                • Ensure good lighting<br />
                • Remove hat / glasses<br />
                • Keep neutral expression
              </p>
            </div>
          </motion.div>
        </div>
      </form>
    </div>
  );
}
