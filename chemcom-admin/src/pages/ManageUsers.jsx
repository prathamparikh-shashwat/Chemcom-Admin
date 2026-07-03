import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, BACKEND_URL } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

export default function ManageUsers() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/users/?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load users: ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while loading admin accounts.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token, fetchUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/users/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          full_name: fullName,
          password,
          is_active: isActive,
          is_superuser: isSuperuser,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to create admin account.');
      }

      setSuccessMsg(`Admin account "${email}" successfully registered!`);
      // Reset form
      setEmail('');
      setFullName('');
      setPassword('');
      setIsActive(true);
      setIsSuperuser(false);

      // Refresh list
      await fetchUsers();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-wrapper">
        <header className="header">
          <h1 className="header-title">Manage Admin Accounts</h1>
        </header>

        <main className="content-container">
          {error && <div className="alert-error">{error}</div>}
          {successMsg && (
            <div className="alert-success" style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#a7f3d0',
              padding: '12px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '20px'
            }}>
              {successMsg}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Create Admin User Form */}
            <div className="create-admin-form">
              <h3 className="details-section-title" style={{ marginBottom: '20px' }}>Register New Admin</h3>
              <form onSubmit={handleSubmit}>
                <div className="create-admin-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="user-email-input">Email Address</label>
                    <input 
                      id="user-email-input"
                      type="email" 
                      className="form-input" 
                      placeholder="admin@chemcom.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="user-fullname-input">Full Name</label>
                    <input 
                      id="user-fullname-input"
                      type="text" 
                      className="form-input" 
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="user-password-input">Password</label>
                    <input 
                      id="user-password-input"
                      type="password" 
                      className="form-input" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', gap: '30px', alignItems: 'center', marginTop: '25px' }}>
                    <label className="checkbox-label" htmlFor="is-active-check">
                      <input 
                        id="is-active-check"
                        type="checkbox" 
                        className="checkbox-input"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        disabled={submitting}
                      />
                      Is Active
                    </label>

                    <label className="checkbox-label" htmlFor="is-superuser-check">
                      <input 
                        id="is-superuser-check"
                        type="checkbox" 
                        className="checkbox-input"
                        checked={isSuperuser}
                        onChange={(e) => setIsSuperuser(e.target.checked)}
                        disabled={submitting}
                      />
                      Superuser Privilege
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: 'auto', minWidth: '150px' }}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="loading-spinner"></span>
                        Registering...
                      </>
                    ) : (
                      'Register User'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* List of existing Admin Users */}
            <div className="table-container">
              <h3 className="details-section-title" style={{ padding: '20px 24px 0 24px', marginBottom: '0', borderBottom: 'none' }}>
                Existing Accounts
              </h3>
              {loading && users.length === 0 ? (
                <div className="empty-state" style={{ padding: '60px' }}>
                  <span className="loading-spinner" style={{ width: '35px', height: '35px', borderWidth: '3px' }}></span>
                  <p style={{ marginTop: '15px' }}>Loading registered users...</p>
                </div>
              ) : (
                <table className="table" style={{ marginTop: '15px' }}>
                  <thead>
                    <tr>
                      <th className="th">ID</th>
                      <th className="th">Full Name</th>
                      <th className="th">Email</th>
                      <th className="th">Status</th>
                      <th className="th">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="tr">
                        <td className="td" style={{ fontWeight: '600', color: 'white' }}>#{u.id}</td>
                        <td className="td">{u.full_name || 'N/A'}</td>
                        <td className="td" style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                        <td className="td">
                          <span className={`badge ${u.is_active ? 'badge-completed' : 'badge-rejected'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="td">
                          {u.is_superuser ? (
                            <span className="admin-tag" style={{ margin: '0' }}>Superuser</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Standard Admin</span>
                          )}
                          {u.id === currentUser?.id && (
                            <span style={{ marginLeft: '10px', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>
                              (You)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
