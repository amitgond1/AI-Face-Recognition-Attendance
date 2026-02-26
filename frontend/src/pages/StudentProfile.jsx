// src/pages/StudentProfile.jsx - Individual Student Profile with Attendance History
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { studentAPI, attendanceAPI } from '../api';

export default function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [stats, setStats] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Build a map of date → status for calendar coloring
  const attendanceMap = {};
  attendance.forEach(a => { attendanceMap[a.date] = a.status; });

  useEffect(() => {
    (async () => {
      try {
        const [studentRes, attendanceRes] = await Promise.all([
          studentAPI.getById(id),
          attendanceAPI.getStudentHistory(id),
        ]);
        setStudent(studentRes.data.student);
        setStats(studentRes.data.stats);
        setAttendance(attendanceRes.data.attendance || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const getTileClass = ({ date }) => {
    const d = date.toISOString().split('T')[0];
    const status = attendanceMap[d];
    if (status === 'Present') return 'present-day';
    if (status === 'Late') return 'late-day';
    if (status === 'Absent') return 'absent-day';
    return '';
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>
      Loading<span className="dot-1">.</span><span className="dot-2">.</span><span className="dot-3">.</span>
    </div>
  );

  if (!student) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <p>Student not found</p>
      <Link to="/admin" className="btn-primary" style={{ marginTop: 16, textDecoration: 'none', display: 'inline-flex' }}>← Back to Admin</Link>
    </div>
  );

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 28 }}>
        <Link to="/admin" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14 }}>← Students</Link>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{student.name}</h1>
      </motion.div>

      {/* Profile Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, marginBottom: 24 }}>
        <motion.div className="glass" style={{ padding: 28, textAlign: 'center' }}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          {/* Avatar */}
          <div style={{
            width: 100, height: 100, borderRadius: '50%', margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40, boxShadow: '0 8px 32px rgba(79,70,229,0.4)',
          }}>
            {student.imageUrl ? (
              <img src={`http://localhost:8000${student.imageUrl}`} alt={student.name}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                onError={e => { e.target.style.display = 'none'; }} />
            ) : '👤'}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{student.name}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 4 }}>{student.studentId}</p>
          <p style={{ color: '#A5B4FC', fontSize: 13 }}>{student.department}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>{student.email}</p>
          {student.phone && <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{student.phone}</p>}
          <span style={{ marginTop: 12, display: 'inline-block', fontSize: 12, color: student.faceRegistered ? '#10B981' : '#F59E0B', fontWeight: 600 }}>
            {student.faceRegistered ? '✅ Face Registered' : '⚠️ No Face Data'}
          </span>
        </motion.div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'Total Present', value: stats?.totalPresent, color: '#10B981', icon: '✅' },
            { label: 'Total Absent', value: stats?.totalAbsent, color: '#EF4444', icon: '❌' },
            { label: 'Total Days', value: stats?.totalDays, color: '#6366F1', icon: '📅' },
            { label: 'Attendance %', value: stats ? `${stats.attendancePercentage}%` : '—', color: '#06B6D4', icon: '📈' },
          ].map(({ label, value, color, icon }, i) => (
            <motion.div key={label} className="glass" style={{ padding: 24, textAlign: 'center' }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <div style={{ fontSize: 28 }}>{icon}</div>
              <div style={{ fontSize: 36, fontWeight: 800, color, marginTop: 8 }}>{value ?? '—'}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['overview', '📋 History'], ['calendar', '🗓️ Calendar']].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', borderRadius: 10, border: 'none', fontFamily: 'inherit',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              background: activeTab === tab ? 'rgba(79,70,229,0.3)' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab ? '#A5B4FC' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}>{label}</button>
        ))}
      </div>

      {activeTab === 'overview' ? (
        /* Attendance History Table */
        <motion.div className="glass" style={{ overflow: 'hidden' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th><th>Entry Time</th><th>Exit Time</th><th>Status</th><th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No attendance records</td></tr>
                ) : attendance.map(a => (
                  <tr key={a._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{a.date}</td>
                    <td style={{ color: '#10B981', fontFamily: 'monospace' }}>{a.entryTime || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{a.exitTime || '—'}</td>
                    <td><span className={`badge-${a.status?.toLowerCase() || 'present'}`}>{a.status}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{a.confidence ? `${a.confidence}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        /* Calendar View */
        <motion.div className="glass" style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <style>{`
            .react-calendar { background: transparent !important; border: none !important; width: 100% !important; max-width: 600px; }
            .react-calendar__tile { color: var(--text-primary) !important; border-radius: 8px !important; height: 52px !important; }
            .react-calendar__month-view__days__day { background: rgba(255,255,255,0.02) !important; }
            .present-day { background: rgba(16,185,129,0.25) !important; border: 1px solid rgba(16,185,129,0.5) !important; }
            .late-day { background: rgba(245,158,11,0.25) !important; border: 1px solid rgba(245,158,11,0.5) !important; }
            .absent-day { background: rgba(239,68,68,0.2) !important; border: 1px solid rgba(239,68,68,0.4) !important; }
            .react-calendar__navigation button { color: var(--text-primary) !important; background: rgba(255,255,255,0.05) !important; border-radius: 8px !important; }
            .react-calendar__month-view__weekdays abbr { color: var(--text-secondary) !important; text-decoration: none !important; }
          `}</style>
          <Calendar tileClassName={getTileClass} />
          <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
            {[['present-day', '#10B981', 'Present'], ['late-day', '#F59E0B', 'Late'], ['absent-day', '#EF4444', 'Absent']].map(([cls, color, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: `${color}40`, border: `1px solid ${color}70` }} />
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
