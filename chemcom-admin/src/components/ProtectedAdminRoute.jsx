import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedAdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#07080c',
        color: '#9ca3af'
      }}>
        <div className="loading-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
        <p style={{ marginTop: '16px', fontWeight: '500' }}>Verifying admin authorization...</p>
      </div>
    );
  }

  if (!user || !user.is_superuser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedAdminRoute;
