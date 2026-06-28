import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// This component wraps any page that should require login.
// If there's no logged-in user, it redirects to /login instead of
// rendering the page's children.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    // While we're still checking if the saved token is valid, show nothing
    // (or a spinner) instead of flashing the login page incorrectly.
    return <div style={{ padding: 40, color: '#1e293b' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}