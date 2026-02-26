// src/pages/Logs.jsx - Recognition Logs
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { attendanceAPI } from '../api';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await attendanceAPI.getAll({ date: today });
      setLogs(res.data.attendance || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Recognition Logs</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Face recognition events today</p>
      </motion.div>

      <button onClick={fetchLogs} className="btn-secondary" style={{ marginBottom: 20, fontSize: 13 }}>🔄 Refresh</button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div className="glass" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading<span className="dot-1">.</span><span className="dot-2">.</span><span className="dot-3">.</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="glass" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
            No recognition events today
          </div>
        ) : (
          logs.map((log, i) => (
            <motion.div key={log._id} className="glass"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: log.status === 'Present' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                }}>
                  {log.status === 'Present' ? '✅' : '⏰'}
                </div>
                <div>
                  <p style={{ fontWeight: 600 }}>
                    <strong>{log.studentName}</strong> recognized at {log.entryTime}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {log.studentId} · {log.department}
                    {log.confidence ? ` · ${log.confidence}% confidence` : ''}
                  </p>
                </div>
              </div>
              <span className={`badge-${log.status?.toLowerCase() || 'present'}`}>{log.status}</span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
