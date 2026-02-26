// src/pages/StudentKiosk.jsx
// A dedicated student-facing attendance page
// Students click their card → webcam opens → face scanned → attendance marked
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { studentAPI, attendanceAPI } from '../api';
import QuickAttendanceModal from '../components/QuickAttendanceModal';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function StudentKiosk() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [markedToday, setMarkedToday] = useState(new Set()); // studentIds marked today
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
    fetchTodayAttendance();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await studentAPI.getAll();
      setStudents(res.data.students || []);
    } catch (e) {
      toast.error('Could not load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await attendanceAPI.getAll({ date: today });
      const ids = new Set((res.data.attendance || []).map(a => a.studentId));
      setMarkedToday(ids);
    } catch (e) {}
  };

  const handleMarked = (studentId) => {
    setMarkedToday(prev => new Set([...prev, studentId]));
    setSelectedStudent(null);
    fetchTodayAttendance();
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId.toLowerCase().includes(search.toLowerCase()) ||
    s.department.toLowerCase().includes(search.toLowerCase())
  );

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', padding: '40px 24px', position: 'relative' }}>
      {/* Exit Button */}
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          position: 'absolute', top: 24, left: 24,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: 12,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          fontWeight: 600, fontSize: 13, fontFamily: 'inherit', transition: 'all 0.2s'
        }}
        onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        ← Back to Admin
      </button>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 28, textAlign: 'center' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12,
            background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)',
            borderRadius: 999, padding: '6px 18px',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse-ring 2s infinite' }} />
            <span style={{ fontSize: 13, color: '#A5B4FC', fontWeight: 600 }}>Attendance Kiosk — {today}</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900 }}>👋 Mark Your Attendance</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 15 }}>
            Click your name below — face recognition will mark your attendance automatically
          </p>
        </motion.div>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="glass"
        style={{ padding: '14px 24px', marginBottom: 24, display: 'flex', gap: 32, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#6366F1' }}>{students.length}</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Students</p>
        </div>
        <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#10B981' }}>{markedToday.size}</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Present Today</p>
        </div>
        <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#EF4444' }}>{students.length - markedToday.size}</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Not Yet Marked</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} style={{ marginBottom: 20 }}>
        <input
          type="text"
          className="input-field"
          placeholder="🔍 Search your name or student ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 480, fontSize: 15 }}
        />
      </motion.div>

      {/* Student Cards Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass" style={{ padding: 24, height: 140, opacity: 0.4 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass" style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
          No students found
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {filtered.map((s, i) => {
            const isMarked = markedToday.has(s.studentId);
            return (
              <motion.div
                key={s._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={!isMarked ? { y: -6, boxShadow: '0 20px 48px rgba(79,70,229,0.35)' } : {}}
                onClick={() => !isMarked && setSelectedStudent(s)}
                className="glass"
                style={{
                  padding: 22,
                  cursor: isMarked ? 'default' : 'pointer',
                  border: isMarked
                    ? '1px solid rgba(16,185,129,0.4)'
                    : '1px solid rgba(255,255,255,0.08)',
                  background: isMarked
                    ? 'rgba(16,185,129,0.07)'
                    : 'rgba(255,255,255,0.04)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.25s',
                }}
              >
                {/* Marked badge */}
                {isMarked && (
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)',
                    borderRadius: 999, padding: '2px 8px', fontSize: 11, color: '#10B981', fontWeight: 700,
                  }}>
                    ✅ Done
                  </div>
                )}

                {/* Avatar */}
                <div style={{
                  width: 52, height: 52, borderRadius: 14, marginBottom: 14,
                  background: isMarked
                    ? 'linear-gradient(135deg, #10B981, #059669)'
                    : 'linear-gradient(135deg, #4F46E5, #06B6D4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, boxShadow: isMarked
                    ? '0 4px 20px rgba(16,185,129,0.4)'
                    : '0 4px 20px rgba(79,70,229,0.3)',
                }}>
                  {isMarked ? '✅' : '👤'}
                </div>

                <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: isMarked ? '#6EE7B7' : 'var(--text-primary)' }}>
                  {s.name}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>{s.studentId}</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.department}</p>

                {!isMarked && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    style={{
                      position: 'absolute', inset: 0, borderRadius: 16,
                      background: 'rgba(79,70,229,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: '#A5B4FC',
                      backdropFilter: 'blur(2px)',
                    }}
                  >
                    📸 Click to Mark
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

        {/* Quick Attendance Modal */}
        {selectedStudent && (
          <QuickAttendanceModal
            student={selectedStudent}
            onClose={() => setSelectedStudent(null)}
            onMarked={() => handleMarked(selectedStudent.studentId)}
          />
        )}
      </div>
    </div>
  );
}
