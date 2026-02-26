// src/pages/Dashboard.jsx - Main Dashboard with Stats and Charts
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar
} from 'recharts';
import { attendanceAPI } from '../api';

const StatCard = ({ icon, label, value, color, delay = 0 }) => (
  <motion.div
    className="glass"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ y: -4, boxShadow: `0 20px 40px ${color}30` }}
    style={{ padding: 24, cursor: 'default', position: 'relative', overflow: 'hidden' }}
  >
    <div style={{
      position: 'absolute', top: -20, right: -20, width: 80, height: 80,
      borderRadius: '50%', background: `${color}15`
    }} />
    <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 36, fontWeight: 800, color }}>{value ?? '—'}</div>
    <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass" style={{ padding: '12px 16px', fontSize: 13 }}>
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartRange, setChartRange] = useState('weekly');

  useEffect(() => {
    fetchStats();
    fetchChartData('weekly');
  }, []);

  const fetchStats = async () => {
    try {
      const res = await attendanceAPI.getTodayStats();
      setStats(res.data.stats);
    } catch (e) { console.error(e); }
  };

  const fetchChartData = async (range) => {
    try {
      const res = await attendanceAPI.getChartData(range);
      setChartData(res.data.data || []);
      setChartRange(range);
    } catch (e) { console.error(e); }
  };

  const statCards = [
    { icon: '👥', label: 'Total Students', value: stats?.totalStudents, color: '#6366F1' },
    { icon: '✅', label: 'Present Today', value: stats?.presentToday, color: '#10B981' },
    { icon: '❌', label: 'Absent Today', value: stats?.absentToday, color: '#EF4444' },
    { icon: '⏰', label: 'Late Today', value: stats?.lateToday, color: '#F59E0B' },
    { icon: '📈', label: 'Avg Attendance', value: stats ? `${stats.avgAttendance}%` : null, color: '#06B6D4' },
  ];

  return (
    <div style={{ maxWidth: 1400 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="glass"
        style={{ padding: 20, marginBottom: 28, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
      >
        <span style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600 }}>Quick Actions:</span>
        <Link to="/live" className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>📹 Start Recognition</Link>
        <Link to="/register-face" className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>👤 Register Student</Link>
        <Link to="/reports" className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>📊 View Reports</Link>
      </motion.div>

      {/* Stat Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 20, marginBottom: 32
      }}>
        {statCards.map((card, i) => (
          <StatCard key={card.label} {...card} delay={i * 0.08} />
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Area Chart */}
        <motion.div className="glass" style={{ padding: 24 }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Attendance Trend</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {['weekly', 'monthly'].map(r => (
                <button key={r}
                  onClick={() => fetchChartData(r)}
                  style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                    background: chartRange === r ? 'rgba(79,70,229,0.3)' : 'rgba(255,255,255,0.05)',
                    color: chartRange === r ? '#A5B4FC' : 'var(--text-secondary)',
                    transition: 'all 0.2s',
                  }}
                >{r}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="present" name="Present" stroke="#4F46E5" fill="url(#presentGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="absent" name="Absent" stroke="#EF4444" fill="url(#absentGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Bar Chart */}
        <motion.div className="glass" style={{ padding: 24 }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Daily Comparison</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="present" name="Present" fill="#4F46E5" radius={[6, 6, 0, 0]} />
              <Bar dataKey="absent" name="Absent" fill="#EF4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
