// src/components/QuickAttendanceModal.jsx
// Click a student → webcam opens → face scanned → attendance marked for today
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import { aiServerAPI, attendanceAPI } from '../api';
import toast from 'react-hot-toast';

const SCAN_INTERVAL = 1500; // ms between recognition attempts

export default function QuickAttendanceModal({ student, onClose, onMarked }) {
  const webcamRef = useRef(null);
  const intervalRef = useRef(null);

  const [stage, setStage] = useState('scanning'); // scanning | matched | wrong | error | done | already
  const [confidence, setConfidence] = useState(0);
  const [time, setTime] = useState('');
  const [dots, setDots] = useState('');
  const [scanCount, setScanCount] = useState(0);

  // Animated dots for "Scanning..."
  useEffect(() => {
    const d = setInterval(() => setDots(p => p.length >= 3 ? '' : p + '.'), 400);
    return () => clearInterval(d);
  }, []);

  // Auto-start scanning when modal opens
  useEffect(() => {
    const timeout = setTimeout(() => startScanning(), 1200); // small delay for webcam init
    return () => {
      clearTimeout(timeout);
      stopScanning();
    };
  }, []);

  const stopScanning = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const startScanning = () => {
    intervalRef.current = setInterval(scanFace, SCAN_INTERVAL);
  };

  const scanFace = useCallback(async () => {
    if (!webcamRef.current) return;
    const screenshot = webcamRef.current.getScreenshot({ width: 640, height: 480 });
    if (!screenshot) return;

    setScanCount(c => c + 1);

    try {
      const res = await aiServerAPI.recognize(screenshot);
      const data = res.data;

      if (!data.recognized) return; // keep scanning

      const recognizedId = data.studentId;
      const conf = data.confidence || 0;

      if (recognizedId === student.studentId) {
        // ✅ Correct student face matched
        stopScanning();
        setConfidence(conf);
        setStage('matched');

        // Mark attendance
        try {
          const attRes = await attendanceAPI.mark({
            studentId: student.studentId,
            confidence: conf,
          });

          if (attRes.data.alreadyMarked) {
            setStage('already');
            setTime(attRes.data.attendance?.entryTime || '');
          } else {
            setStage('done');
            const now = new Date();
            setTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            toast.success(`✅ Attendance marked for ${student.name}`);
            onMarked?.();
          }
        } catch (attErr) {
          const msg = attErr.response?.data?.message || '';
          if (msg.toLowerCase().includes('already')) {
            setStage('already');
          } else {
            setStage('error');
          }
        }
      } else {
        // ⚠️ Wrong face
        stopScanning();
        setStage('wrong');
        setTimeout(() => {
          setStage('scanning');
          startScanning();
        }, 2500);
      }
    } catch (e) {
      // AI server may be slow — keep scanning silently
      console.warn('Scan attempt failed:', e.message);
    }
  }, [student]);

  const handleRetry = () => {
    setStage('scanning');
    setScanCount(0);
    startScanning();
  };

  const stageConfig = {
    scanning: {
      color: '#4F46E5',
      icon: '👁️',
      title: `Scanning${dots}`,
      subtitle: 'Look at the camera to mark attendance',
      bg: 'rgba(79,70,229,0.15)',
    },
    matched: {
      color: '#10B981',
      icon: '✅',
      title: 'Face Matched!',
      subtitle: `${student.name} recognized — marking attendance...`,
      bg: 'rgba(16,185,129,0.15)',
    },
    done: {
      color: '#10B981',
      icon: '🎉',
      title: 'Attendance Marked!',
      subtitle: `Present at ${time}`,
      bg: 'rgba(16,185,129,0.15)',
    },
    already: {
      color: '#F59E0B',
      icon: '⏰',
      title: 'Already Marked',
      subtitle: `Attendance already recorded today${time ? ` at ${time}` : ''}`,
      bg: 'rgba(245,158,11,0.15)',
    },
    wrong: {
      color: '#F59E0B',
      icon: '⚠️',
      title: 'Wrong Person',
      subtitle: 'Face does not match this student. Retrying...',
      bg: 'rgba(245,158,11,0.15)',
    },
    error: {
      color: '#EF4444',
      icon: '❌',
      title: 'Error',
      subtitle: 'Could not mark attendance. Try again.',
      bg: 'rgba(239,68,68,0.15)',
    },
  };

  const cfg = stageConfig[stage] || stageConfig.scanning;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}
      >
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 480,
            background: 'rgba(15,15,26,0.97)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Quick Attendance
              </p>
              <p style={{ fontWeight: 700, fontSize: 16, marginTop: 2 }}>{student.name}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{student.studentId} · {student.department}</p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)',
                fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'inherit',
              }}
            >×</button>
          </div>

          {/* Webcam */}
          <div style={{ position: 'relative', background: '#000', maxHeight: 300, overflow: 'hidden' }}>
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              style={{ display: 'block' }}
              onUserMediaError={() => toast.error('Camera not accessible')}
            />

            {/* Scanning ring overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <motion.div
                animate={stage === 'scanning' ? {
                  boxShadow: [
                    `0 0 0 0 ${cfg.color}80`,
                    `0 0 0 30px ${cfg.color}00`,
                  ],
                } : {}}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{
                  width: 120, height: 120, borderRadius: '50%',
                  border: `3px solid ${cfg.color}`,
                  opacity: 0.7,
                }}
              />
            </div>

            {/* Corner scan markers */}
            {['tl', 'tr', 'bl', 'br'].map(pos => (
              <div key={pos} style={{
                position: 'absolute',
                top: pos[0] === 't' ? 12 : 'auto', bottom: pos[0] === 'b' ? 12 : 'auto',
                left: pos[1] === 'l' ? 12 : 'auto', right: pos[1] === 'r' ? 12 : 'auto',
                width: 18, height: 18,
                borderTop: pos[0] === 't' ? `3px solid ${cfg.color}` : 'none',
                borderBottom: pos[0] === 'b' ? `3px solid ${cfg.color}` : 'none',
                borderLeft: pos[1] === 'l' ? `3px solid ${cfg.color}` : 'none',
                borderRight: pos[1] === 'r' ? `3px solid ${cfg.color}` : 'none',
              }} />
            ))}

            {/* Scan count badge */}
            {stage === 'scanning' && (
              <div style={{
                position: 'absolute', top: 12, left: 12,
                background: 'rgba(0,0,0,0.6)', borderRadius: 8,
                padding: '4px 8px', fontSize: 11, color: '#94A3B8',
              }}>
                Scan #{scanCount}
              </div>
            )}
          </div>

          {/* Status Panel */}
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: 24,
              background: cfg.bg,
              borderTop: `1px solid ${cfg.color}30`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>{cfg.icon}</div>
            <p style={{ fontWeight: 700, fontSize: 18, color: cfg.color }}>{cfg.title}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>{cfg.subtitle}</p>

            {/* Confidence badge */}
            {confidence > 0 && (stage === 'done' || stage === 'matched') && (
              <div style={{
                display: 'inline-block', marginTop: 12,
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 999, padding: '4px 14px',
                fontSize: 13, fontWeight: 700, color: '#10B981',
              }}>
                {confidence}% confidence
              </div>
            )}

            {/* Today's date */}
            {(stage === 'done' || stage === 'already') && (
              <p style={{ marginTop: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                📅 {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18 }}>
              {(stage === 'done' || stage === 'already') && (
                <motion.button
                  className="btn-primary"
                  onClick={onClose}
                  whileTap={{ scale: 0.95 }}
                  style={{ padding: '10px 24px' }}
                >
                  Close ✓
                </motion.button>
              )}
              {stage === 'error' && (
                <motion.button
                  className="btn-secondary"
                  onClick={handleRetry}
                  whileTap={{ scale: 0.95 }}
                >
                  🔄 Retry
                </motion.button>
              )}
              {stage === 'scanning' && (
                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-secondary)', borderRadius: 12, padding: '8px 20px',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </motion.div>

          {/* AI Server warning */}
          <div style={{
            padding: '10px 20px',
            background: 'rgba(0,0,0,0.3)',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center',
          }}>
            🤖 AI Server must be running on port 8000 for face recognition
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
