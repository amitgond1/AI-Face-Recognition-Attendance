// src/pages/LiveRecognition.jsx - Real-Time Face Recognition
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import { aiServerAPI, attendanceAPI } from '../api';
import toast from 'react-hot-toast';

const RECOGNITION_INTERVAL = 1500; // ms between recognition calls

export default function LiveRecognition() {
  const [isRunning, setIsRunning] = useState(false);
  const [recognized, setRecognized] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [fps, setFps] = useState(0);
  const [faceCount, setFaceCount] = useState(0);
  const [cameraId, setCameraId] = useState('');
  const [cameras, setCameras] = useState([]);
  const [systemStatus, setSystemStatus] = useState('idle'); // idle | recognizing | unknown
  const [maskInfo, setMaskInfo] = useState(null);
  const [quality, setQuality] = useState(null);
  const [embeddingCount, setEmbeddingCount] = useState(0);
  const [autoStopTime, setAutoStopTime] = useState('17:00');
  const webcamRef = useRef(null);
  const intervalRef = useRef(null);
  const fpsRef = useRef({ frames: 0, lastTime: Date.now() });
  const markedToday = useRef(new Set());

  // Load camera devices
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const cams = devices.filter(d => d.kind === 'videoinput');
      setCameras(cams);
      if (cams.length > 0) setCameraId(cams[0].deviceId);
    });
    fetchEmbeddingStats();
    fetchRecentAttendance();
    return () => stopRecognition();
  }, []);

  // Auto-stop at configured time
  useEffect(() => {
    const checkAutoStop = setInterval(() => {
      const now = new Date();
      const [h, m] = autoStopTime.split(':').map(Number);
      if (now.getHours() === h && now.getMinutes() === m && isRunning) {
        stopRecognition();
        toast('⏰ Auto-stopped at configured time', { icon: '🛑' });
      }
    }, 60000);
    return () => clearInterval(checkAutoStop);
  }, [autoStopTime, isRunning]);

  const fetchEmbeddingStats = async () => {
    try {
      const res = await aiServerAPI.getEmbeddingStats();
      setEmbeddingCount(res.data.total_embeddings || 0);
    } catch (e) {}
  };

  const fetchRecentAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await attendanceAPI.getAll({ date: today });
      setRecentAttendance(res.data.attendance || []);
    } catch (e) {}
  };

  const recognize = useCallback(async () => {
    if (!webcamRef.current) return;
    const screenshot = webcamRef.current.getScreenshot({ width: 640, height: 480 });
    if (!screenshot) return;

    const start = Date.now();
    try {
      const res = await aiServerAPI.recognize(screenshot);
      const data = res.data;

      setQuality(data.quality);
      setMaskInfo(data.mask_info);
      setFaceCount(data.faceCount || 0);

      if (data.recognized && data.faces?.length > 0) {
        setSystemStatus('recognizing');
        const newRecognized = data.faces.filter(f => f.recognized);
        setRecognized(newRecognized);

        // Mark attendance for recognized faces (deduplicated)
        for (const face of newRecognized) {
          if (!markedToday.current.has(face.studentId)) {
            try {
              const attRes = await attendanceAPI.mark({
                studentId: face.studentId,
                confidence: face.confidence,
              });
              if (!attRes.data.alreadyMarked) {
                markedToday.current.add(face.studentId);
                toast.success(`✅ ${face.name} — ${face.confidence}%`);
                fetchRecentAttendance();
              }
            } catch (e) {}
          }
        }
      } else if (data.faceCount > 0) {
        setSystemStatus('unknown');
        setRecognized([{ recognized: false, name: 'Unknown', confidence: 0 }]);
      } else {
        setSystemStatus('idle');
        setRecognized([]);
      }

      // FPS calculation
      fpsRef.current.frames++;
      const elapsed = Date.now() - fpsRef.current.lastTime;
      if (elapsed >= 1000) {
        setFps(Math.round((fpsRef.current.frames * 1000) / elapsed));
        fpsRef.current = { frames: 0, lastTime: Date.now() };
      }
    } catch (e) {
      console.error('Recognition error:', e.message);
    }
  }, []);

  const startRecognition = () => {
    setIsRunning(true);
    markedToday.current = new Set();
    intervalRef.current = setInterval(recognize, RECOGNITION_INTERVAL);
    toast.success('🎯 Recognition started');
  };

  const stopRecognition = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRecognized([]);
    setSystemStatus('idle');
    setFps(0);
  };

  const getStatusColor = () => {
    if (systemStatus === 'recognizing') return '#10B981';
    if (systemStatus === 'unknown') return '#F59E0B';
    return '#6B7280';
  };

  return (
    <div style={{ maxWidth: 1400 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Live Recognition</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Real-time AI-powered face recognition</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* FPS Counter */}
          <div className="glass" style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, color: fps > 0 ? '#10B981' : 'var(--text-secondary)' }}>
            ⚡ FPS: {fps}
          </div>
          {/* Embedding Count */}
          <div className="glass" style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#A5B4FC' }}>
            🧠 {embeddingCount} faces in DB
          </div>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Camera Feed */}
        <div>
          <motion.div className="glass" style={{ padding: 4, position: 'relative', overflow: 'hidden', borderRadius: 16 }}
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            {/* Camera selector */}
            {cameras.length > 1 && (
              <div style={{ padding: '8px 12px' }}>
                <select className="input-field" value={cameraId} onChange={e => setCameraId(e.target.value)}
                  style={{ fontSize: 13, padding: '6px 12px' }}>
                  {cameras.map((c, i) => <option key={c.deviceId} value={c.deviceId}>📷 Camera {i + 1}: {c.label || `Camera ${i + 1}`}</option>)}
                </select>
              </div>
            )}

            <div style={{ position: 'relative', background: '#000', borderRadius: 12, overflow: 'hidden', minHeight: 360 }}>
              <Webcam ref={webcamRef} screenshotFormat="image/jpeg" width="100%" height="auto"
                videoConstraints={{ deviceId: cameraId || undefined, width: 1280, height: 720 }}
                style={{ display: 'block' }} />

              {/* Status overlay */}
              <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', background: getStatusColor(),
                  boxShadow: isRunning ? `0 0 0 4px ${getStatusColor()}30` : 'none',
                  animation: isRunning ? 'pulse-ring 2s infinite' : 'none'
                }} />
                <span className="glass" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 600, color: getStatusColor() }}>
                  {isRunning ? (systemStatus === 'recognizing' ? '● RECOGNIZING' : systemStatus === 'unknown' ? '● UNKNOWN FACE' : '● SCANNING') : '● STANDBY'}
                </span>
              </div>

              {/* Quality Indicator */}
              {quality && (
                <div style={{ position: 'absolute', top: 12, right: 12 }} className="glass">
                  <div style={{ padding: '4px 10px', fontSize: 11, color: quality.passed ? '#10B981' : '#F59E0B' }}>
                    {quality.passed ? '✅ Good Quality' : `⚠️ ${quality.is_blurry ? 'Blurry' : quality.is_dark ? 'Dark' : 'Low Quality'}`}
                  </div>
                </div>
              )}

              {/* Face labels overlay */}
              <AnimatePresence>
                {recognized.map((face, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    style={{
                      position: 'absolute', bottom: 12 + i * 56, left: 12,
                      padding: '8px 14px', borderRadius: 10,
                      background: face.recognized ? 'rgba(16,185,129,0.9)' : 'rgba(245,158,11,0.9)',
                      backdropFilter: 'blur(10px)', color: '#fff', fontWeight: 700, fontSize: 14,
                    }}>
                    {face.recognized ? `✅ ${face.name}` : '⚠️ Unknown Person'} — {face.confidence}%
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Mask warning */}
              {maskInfo?.has_mask && (
                <div style={{ position: 'absolute', bottom: 12, right: 12 }} className="glass">
                  <div style={{ padding: '6px 12px', color: '#F59E0B', fontSize: 13, fontWeight: 600 }}>😷 Mask Detected</div>
                </div>
              )}

              {/* Recognizing animation */}
              {isRunning && systemStatus === 'idle' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      Recognizing faces<span className="dot-1">.</span><span className="dot-2">.</span><span className="dot-3">.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ padding: '12px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {!isRunning ? (
                <motion.button className="btn-primary" onClick={startRecognition} whileTap={{ scale: 0.95 }}>
                  ▶ Start Recognition
                </motion.button>
              ) : (
                <motion.button className="btn-danger" onClick={stopRecognition} whileTap={{ scale: 0.95 }}>
                  ⏹ Stop
                </motion.button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Auto-stop:</label>
                <input type="time" value={autoStopTime} onChange={e => setAutoStopTime(e.target.value)}
                  className="input-field" style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }} />
              </div>
            </div>
          </motion.div>

          {/* Unknown face register prompt */}
          {systemStatus === 'unknown' && (
            <motion.div className="glass" style={{ padding: 20, marginTop: 16, border: '1px solid rgba(245,158,11,0.3)' }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 700, color: '#F59E0B' }}>⚠️ Unknown Person Detected</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>This person is not registered in the system.</p>
                </div>
                <a href="/register-face" className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, textDecoration: 'none' }}>
                  ➕ Register Student
                </a>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Panel: Recent Attendance */}
        <div>
          <motion.div className="glass" style={{ padding: 20, height: '100%' }}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📋 Recent Attendance Today</h3>

            {recentAttendance.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 20px', fontSize: 14 }}>
                No attendance marked yet today
              </div>
            ) : (
              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                {recentAttendance.map((a, i) => (
                  <motion.div key={a._id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      padding: '12px 14px', borderRadius: 10, marginBottom: 8,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14 }}>{a.studentName}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.department}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>{a.entryTime}</p>
                        <span className={`badge-${a.status.toLowerCase()}`}>{a.status}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <button onClick={fetchRecentAttendance} className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 12, fontSize: 13 }}>
              🔄 Refresh
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
