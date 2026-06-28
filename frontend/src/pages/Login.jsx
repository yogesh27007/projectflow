import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); // stops the browser from doing a full page reload on form submit
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/'); // send them to the Dashboard after successful login
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#eef5f0', fontFamily: '"Inter", system-ui, sans-serif'
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#ffffff', borderRadius: '20px', padding: '32px',
        width: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)'
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px 0' }}>Welcome back</h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px 0' }}>Log in to ProjectFlow</p>

        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box', marginBottom: '14px', outline: 'none' }}
        />

        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box', marginBottom: '14px', outline: 'none' }}
        />

        {error && <p style={{ color: '#ef4444', fontSize: '12px', margin: '0 0 14px 0' }}>{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%', background: '#000000', color: '#ffffff', border: 'none',
            padding: '11px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
            cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.6 : 1
          }}
        >
          {submitting ? 'Logging in...' : 'Log In'}
        </button>

        <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '16px' }}>
          Don't have an account? <Link to="/signup" style={{ color: '#000000', fontWeight: 600 }}>Sign up</Link>
        </p>
      </form>
    </div>
  );
}