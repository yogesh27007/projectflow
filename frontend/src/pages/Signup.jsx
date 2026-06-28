import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signup(name, email, password);
      navigate('/');
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
        <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px 0' }}>Create your account</h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px 0' }}>Join ProjectFlow</p>

        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box', marginBottom: '14px', outline: 'none' }}
        />

        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box', marginBottom: '14px', outline: 'none' }}
        />

        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Password (min 6 characters)</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
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
          {submitting ? 'Creating account...' : 'Sign Up'}
        </button>

        <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '16px' }}>
          Already have an account? <Link to="/login" style={{ color: '#000000', fontWeight: 600 }}>Log in</Link>
        </p>
      </form>
    </div>
  );
}