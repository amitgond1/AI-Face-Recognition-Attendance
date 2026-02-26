// src/pages/AdminPanel.jsx - Admin CRUD Interface
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { studentAPI } from '../api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import QuickAttendanceModal from '../components/QuickAttendanceModal';

const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Business', 'Mathematics', 'Physics', 'Chemistry'];

const emptyForm = { name: '', studentId: '', department: '', email: '', phone: '' };

export default function AdminPanel() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [attendanceStudent, setAttendanceStudent] = useState(null); // student for quick attendance
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getAll();
      setStudents(res.data.students || []);
    } catch (e) { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setForm(emptyForm); setEditStudent(null); setShowModal(true); };
  const openEdit = (s) => { setForm({ name: s.name, studentId: s.studentId, department: s.department, email: s.email, phone: s.phone || '' }); setEditStudent(s); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editStudent) {
        await studentAPI.update(editStudent._id, form);
        toast.success('Student updated successfully');
      } else {
        await studentAPI.create(form);
        toast.success('Student added successfully');
      }
      setShowModal(false);
      fetchStudents();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This will remove all their attendance records.`)) return;
    setDeleting(id);
    try {
      await studentAPI.delete(id);
      toast.success(`${name} deleted`);
      fetchStudents();
    } catch (e) { toast.error('Delete failed'); }
    finally { setDeleting(null); }
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId.toLowerCase().includes(search.toLowerCase()) ||
    s.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1200 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Admin Panel</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{students.length} students registered</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/register-face" className="btn-primary" style={{ textDecoration: 'none' }}>📸 Register with Face</Link>
          <button onClick={openAdd} className="btn-secondary">➕ Add Student</button>
        </div>
      </motion.div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input type="text" className="input-field" placeholder="🔍 Search students..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: 400 }} />
      </div>

      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass" style={{ padding: 24, height: 160, opacity: 0.5 }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, height: 20, marginBottom: 12, width: '60%' }} />
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, height: 12, width: '40%' }} />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
            No students found
          </div>
        ) : (
          filtered.map((s, i) => (
            <motion.div key={s._id} className="glass"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(79,70,229,0.2)' }}
              style={{ padding: 24, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #4F46E5, #06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {s.faceRegistered ? '👤' : '⬜'}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(s)} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#A5B4FC', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>✏️</button>
                  <button onClick={() => handleDelete(s._id, s.name)} disabled={deleting === s._id}
                    style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                    {deleting === s._id ? '...' : '🗑️'}
                  </button>
                </div>
              </div>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{s.name}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 6 }}>{s.studentId} · {s.department}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{s.email}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <span style={{ fontSize: 11, color: s.faceRegistered ? '#10B981' : '#F59E0B', fontWeight: 600 }}>
                  {s.faceRegistered ? '✅ Face Registered' : '⚠️ No Face Data'}
                </span>
                <Link to={`/students/${s._id}`} style={{ color: '#A5B4FC', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>View →</Link>
              </div>

              {/* Mark Attendance Button — works for ALL students */}
              <motion.button
                onClick={() => setAttendanceStudent(s)}
                whileHover={{ scale: 1.02, boxShadow: '0 6px 24px rgba(79,70,229,0.35)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', marginTop: 12, padding: '10px 0',
                  borderRadius: 10, border: '1px solid rgba(79,70,229,0.4)',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                  background: 'linear-gradient(135deg, rgba(79,70,229,0.25), rgba(6,182,212,0.15))',
                  color: '#A5B4FC', transition: 'all 0.2s',
                }}
              >
                📸 Mark Today's Attendance
              </motion.button>
            </motion.div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <motion.div className="glass-strong" style={{ width: '100%', maxWidth: 480, padding: 32 }}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>{editStudent ? '✏️ Edit Student' : '➕ Add Student'}</h2>
              <form onSubmit={handleSave}>
                {[['name', 'Full Name', 'text', 'e.g. Amit Kumar'], ['studentId', 'Student ID', 'text', 'e.g. CS2024001'], ['email', 'Email', 'email', 'student@school.com'], ['phone', 'Phone', 'tel', '+91 9876543210']].map(([key, lbl, type, ph]) => (
                  <div key={key} style={{ marginBottom: 16 }}>
                    <label className="input-label">{lbl} {key !== 'phone' ? '*' : ''}</label>
                    <input type={type} className="input-field" placeholder={ph} value={form[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      required={key !== 'phone'} disabled={key === 'studentId' && !!editStudent} />
                  </div>
                ))}
                <div style={{ marginBottom: 24 }}>
                  <label className="input-label">Department *</label>
                  <select className="input-field" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required style={{ cursor: 'pointer' }}>
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
                    {loading ? 'Saving...' : (editStudent ? '✅ Update' : '✅ Add Student')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Attendance Modal */}
      {attendanceStudent && (
        <QuickAttendanceModal
          student={attendanceStudent}
          onClose={() => setAttendanceStudent(null)}
          onMarked={() => { setAttendanceStudent(null); fetchStudents(); }}
        />
      )}
    </div>
  );
}
