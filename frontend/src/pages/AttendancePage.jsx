// src/pages/AttendancePage.jsx - Full Attendance Table with Search/Filter/Export
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { attendanceAPI, reportAPI } from '../api';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['All', 'Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Business', 'Mathematics', 'Physics', 'Chemistry'];
const STATUSES = ['All', 'Present', 'Late', 'Absent'];

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ date: '', department: '', status: '', search: '' });
  const [sortBy, setSortBy] = useState({ field: 'date', dir: 'desc' });

  useEffect(() => { fetchAttendance(); }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.department && filters.department !== 'All') params.department = filters.department;
      if (filters.status && filters.status !== 'All') params.status = filters.status;
      const res = await attendanceAPI.getAll(params);
      setRecords(res.data.attendance || []);
    } catch (e) { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  const handleExport = (type) => {
    const params = {};
    if (filters.date) params.date = filters.date;
    if (filters.status && filters.status !== 'All') params.status = filters.status;
    const token = localStorage.getItem('token');
    const url = reportAPI[`export${type.charAt(0).toUpperCase() + type.slice(1)}`](params);
    // Open in new tab with auth header hack via link
    const a = document.createElement('a');
    a.href = url + `&token=${token}`;
    a.download = `attendance.${type}`;
    a.click();
    toast.success(`Exporting ${type.toUpperCase()}...`);
  };

  const filtered = records.filter(r => {
    if (!filters.search) return true;
    return r.studentName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      r.studentId?.toLowerCase().includes(filters.search.toLowerCase());
  });

  const sorted = [...filtered].sort((a, b) => {
    const { field, dir } = sortBy;
    const valA = a[field] || '';
    const valB = b[field] || '';
    return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  const toggleSort = (field) => {
    setSortBy(prev => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  return (
    <div style={{ maxWidth: 1400 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Attendance Records</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{records.length} total records</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['csv', 'excel', 'pdf'].map(type => (
            <button key={type} onClick={() => handleExport(type)} className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: 13 }}>
              📥 {type.toUpperCase()}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div className="glass" style={{ padding: 20, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <input type="text" className="input-field" placeholder="🔍 Search by name or ID..." value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
          style={{ flex: 1, minWidth: 200 }} />
        <input type="date" className="input-field" value={filters.date}
          onChange={e => setFilters({ ...filters, date: e.target.value })}
          style={{ width: 160 }} />
        <select className="input-field" value={filters.department}
          onChange={e => setFilters({ ...filters, department: e.target.value })}
          style={{ width: 180, cursor: 'pointer' }}>
          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="input-field" value={filters.status}
          onChange={e => setFilters({ ...filters, status: e.target.value })}
          style={{ width: 140, cursor: 'pointer' }}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={fetchAttendance} className="btn-primary" style={{ padding: '10px 20px', fontSize: 13 }}>🔍 Filter</button>
        <button onClick={() => { setFilters({ date: '', department: '', status: '', search: '' }); fetchAttendance(); }}
          className="btn-secondary" style={{ padding: '10px 16px', fontSize: 13 }}>✕ Clear</button>
      </motion.div>

      {/* Table */}
      <motion.div className="glass" style={{ overflow: 'hidden' }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading<span className="dot-1">.</span><span className="dot-2">.</span><span className="dot-3">.</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {[['studentName', 'Student Name'], ['studentId', 'Student ID'], ['department', 'Department'], ['date', 'Date'], ['entryTime', 'Entry'], ['exitTime', 'Exit'], ['status', 'Status'], ['confidence', 'Confidence'], ['', 'Actions']].map(([field, label]) => (
                    <th key={label} onClick={() => field && toggleSort(field)}
                      style={{ cursor: field ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}>
                      {label} {sortBy.field === field ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  sorted.map((r, i) => (
                    <motion.tr key={r._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                      <td style={{ fontWeight: 600 }}>{r.studentName}</td>
                      <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{r.studentId}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r.department}</td>
                      <td style={{ fontFamily: 'monospace' }}>{r.date}</td>
                      <td style={{ color: '#10B981', fontFamily: 'monospace' }}>{r.entryTime || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{r.exitTime || '—'}</td>
                      <td><span className={`badge-${r.status?.toLowerCase() || 'present'}`}>{r.status}</span></td>
                      <td>{r.confidence ? `${r.confidence}%` : '—'}</td>
                      <td>
                        {r.userId?._id && (
                          <Link to={`/students/${r.userId._id}`}
                            style={{ color: '#6366F1', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
                            View Profile →
                          </Link>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
