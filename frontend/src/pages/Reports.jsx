// src/pages/Reports.jsx - Reports & Analytics
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { attendanceAPI, reportAPI } from '../api';
import toast from 'react-hot-toast';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

export default function Reports() {
  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [range, setRange] = useState('weekly');
  const [loading, setLoading] = useState(false);
  const [exportDates, setExportDates] = useState({ start: '', end: '' });

  useEffect(() => { fetchData(); }, [range]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chartRes, summaryRes] = await Promise.all([
        attendanceAPI.getChartData(range),
        fetch(`http://localhost:5000/api/reports/summary?type=${range}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()),
      ]);
      setChartData(chartRes.data.data || []);
      setSummary(summaryRes.summary);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleExport = (type) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({ ...(exportDates.start && { startDate: exportDates.start }), ...(exportDates.end && { endDate: exportDates.end }) });
    const base = `http://localhost:5000/api/reports/export/${type}`;
    window.open(`${base}?${params}&token=${token}`, '_blank');
    toast.success(`Downloading ${type.toUpperCase()} report`);
  };

  const pieData = summary ? [
    { name: 'Present', value: summary.present },
    { name: 'Late', value: summary.late },
    { name: 'Absent', value: summary.absent },
  ] : [];

  return (
    <div style={{ maxWidth: 1400 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Attendance Reports</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Analytics and data export</p>
      </motion.div>

      {/* Range selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['daily', 'weekly', 'monthly'].map(r => (
          <button key={r} onClick={() => setRange(r)}
            style={{
              padding: '8px 20px', borderRadius: 10, border: 'none', fontFamily: 'inherit',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
              background: range === r ? 'linear-gradient(135deg, #4F46E5, #6366F1)' : 'rgba(255,255,255,0.05)',
              color: range === r ? '#fff' : 'var(--text-secondary)',
              boxShadow: range === r ? '0 4px 20px rgba(79,70,229,0.4)' : 'none',
              transition: 'all 0.2s',
            }}>{r} Report</button>
        ))}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Students', value: summary.totalStudents, color: '#6366F1' },
            { label: 'Present', value: summary.present, color: '#10B981' },
            { label: 'Late', value: summary.late, color: '#F59E0B' },
            { label: 'Absent', value: summary.absent, color: '#EF4444' },
          ].map(({ label, value, color }, i) => (
            <motion.div key={label} className="glass" style={{ padding: 20 }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{label}</p>
              <p style={{ fontSize: 32, fontWeight: 800, color, marginTop: 4 }}>{value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 28 }}>
        {/* Bar Chart */}
        <motion.div className="glass" style={{ padding: 24 }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Attendance Overview</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
              <Legend />
              <Bar dataKey="present" name="Present" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" name="Absent" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie Chart */}
        <motion.div className="glass" style={{ padding: 24 }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((_, index) => <Cell key={index} fill={COLORS[index]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Export Section */}
      <motion.div className="glass" style={{ padding: 24 }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📥 Export Attendance</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <label className="input-label">Start Date</label>
            <input type="date" className="input-field" value={exportDates.start}
              onChange={e => setExportDates({ ...exportDates, start: e.target.value })} style={{ width: 160 }} />
          </div>
          <div>
            <label className="input-label">End Date</label>
            <input type="date" className="input-field" value={exportDates.end}
              onChange={e => setExportDates({ ...exportDates, end: e.target.value })} style={{ width: 160 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[['csv', '📄', '#10B981'], ['excel', '📊', '#059669'], ['pdf', '📑', '#EF4444']].map(([type, icon, color]) => (
            <motion.button key={type} onClick={() => handleExport(type)} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
              style={{
                padding: '12px 24px', borderRadius: 12, border: `1px solid ${color}40`,
                background: `${color}15`, color, fontWeight: 700, fontSize: 14,
                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
              }}>
              {icon} Export {type.toUpperCase()}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
