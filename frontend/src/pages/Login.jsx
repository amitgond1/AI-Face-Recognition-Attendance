// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      login(res.data.token, res.data.admin);
      toast.success(`Welcome back, ${res.data.admin.name}! 👋`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-dark)',
      backgroundImage: 'radial-gradient(ellipse at 30% 50%, rgba(79,70,229,0.2) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(6,182,212,0.15) 0%, transparent 50%)',
      padding: 24,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        {/* Logo */}
        <div className="text-center" style={{ marginBottom: 32 }}>
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            style={{ fontSize: 48, marginBottom: 12 }}
          >🎭</motion.div>
          <h1 className="gradient-text" style={{ fontSize: 32, fontWeight: 800 }}>FaceAttend</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>AI-Powered Attendance System</p>
        </div>

        <motion.div
          className="glass-strong"
          style={{ padding: 36 }}
          whileHover={{ boxShadow: '0 20px 60px rgba(79,70,229,0.2)' }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Admin Login</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
            Sign in to manage attendance
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label className="input-label">Email Address</label>
              <input
                type="email"
                className="input-field"
                placeholder="admin@school.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label className="input-label">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <motion.button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px 24px', fontSize: 15 }}
              disabled={loading}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  Signing in<span className="dot-1">•</span><span className="dot-2">•</span><span className="dot-3">•</span>
                </span>
              ) : '🔐 Sign In'}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: 14 }}>
            No account?{' '}
            <Link to="/signup" style={{ color: '#A5B4FC', fontWeight: 600, textDecoration: 'none' }}>
              Create one →
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
