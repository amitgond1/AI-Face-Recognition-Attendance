// src/components/Sidebar.jsx - Navigation Sidebar
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/live', icon: '📹', label: 'Live Recognition' },
  { path: '/register-face', icon: '👤', label: 'Register Student' },
  { path: '/student-attendance', icon: '🙋', label: 'Student Attendance' },
  { path: '/attendance', icon: '✅', label: 'Attendance Records' },
  { path: '/reports', icon: '📈', label: 'Reports' },
  { path: '/logs', icon: '📋', label: 'Recognition Logs' },
  { path: '/admin', icon: '⚙️', label: 'Admin Panel' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, boxShadow: '0 4px 20px rgba(79,70,229,0.4)'
          }}>🎭</div>
          <div>
            <div className="gradient-text font-bold text-lg">FaceAttend</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>AI Recognition System</div>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '12px 0', flex: 1, overflowY: 'auto' }}>
        {navItems.map((item, i) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <NavLink
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* User Profile + Logout */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="glass" style={{ padding: '12px 14px', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {admin?.name || 'Admin'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            {admin?.email || ''}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn-danger"
          style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 13 }}
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
