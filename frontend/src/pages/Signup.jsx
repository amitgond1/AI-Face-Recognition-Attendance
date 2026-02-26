// src/pages/Signup.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.signup(form);
      login(res.data.token, res.data.admin);
      toast.success('Account created successfully! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-dark)',
      backgroundImage: 'radial-gradient(ellipse at 70% 50%, rgba(6,182,212,0.2) 0%, transparent 60%), radial-gradient(ellipse at 30% 20%, rgba(79,70,229,0.15) 0%, transparent 50%)',
      padding: 24,
    }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 420 }}>
        <div className="text-center" style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎭</div>
          <h1 className="gradient-text" style={{ fontSize: 32, fontWeight: 800 }}>FaceAttend</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Create Admin Account</p>
        </div>

        <div className="glass-strong" style={{ padding: 36 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 28 }}>Sign Up</h2>
          <form onSubmit={handleSubmit}>
            {['name', 'email', 'password'].map((field) => (
              <div key={field} style={{ marginBottom: 20 }}>
                <label className="input-label" style={{ textTransform: 'capitalize' }}>{field === 'name' ? 'Full Name' : field}</label>
                <input
                  type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                  className="input-field"
                  placeholder={field === 'name' ? 'John Doe' : field === 'email' ? 'admin@school.com' : '••••••••'}
                  value={form[field]}
                  onChange={e => setForm({ ...form, [field]: e.target.value })}
                  required
                />
              </div>
            ))}
            <motion.button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px 24px', fontSize: 15, marginTop: 8 }}
              disabled={loading}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Creating account...' : '🚀 Create Account'}
            </motion.button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: 14 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#A5B4FC', fontWeight: 600, textDecoration: 'none' }}>Sign in →</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
