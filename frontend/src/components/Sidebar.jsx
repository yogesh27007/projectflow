import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Users, Zap } from 'lucide-react';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/members', icon: Users, label: 'Team' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: 240, background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex', flexDirection: 'column',
      padding: '20px 12px', gap: 2, flexShrink: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px 28px' }}>
        <div style={{
          width: 32, height: 32,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px #6366f140'
        }}>
          <Zap size={16} color="white" fill="white" />
        </div>
        <span style={{ color: '#1e293b', fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>ProjectFlow</span>
      </div>

      <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, letterSpacing: '1px', padding: '0 12px 8px', textTransform: 'uppercase' }}>Navigation</p>

      {links.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
          borderRadius: 8,
          color: isActive ? '#4f46e5' : '#64748b',
          background: isActive ? '#eef2ff' : 'transparent',
          border: isActive ? '1px solid #c7d2fe' : '1px solid transparent',
          textDecoration: 'none', fontSize: 13, fontWeight: 500,
          transition: 'all 0.15s'
        })}>
          <Icon size={16} /> {label}
        </NavLink>
      ))}

      <div style={{ marginTop: 'auto', padding: '16px 4px 4px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
          background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: '8px'
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'white'
          }}>
            {user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
          </div>
          <div>
            <div style={{ color: '#1e293b', fontSize: 12, fontWeight: 600 }}>{user?.name || 'Guest'}</div>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>{user?.email || ''}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: '#ffffff', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer'
          }}
        >
          Log Out
        </button>
      </div>
    </aside>
  );
}