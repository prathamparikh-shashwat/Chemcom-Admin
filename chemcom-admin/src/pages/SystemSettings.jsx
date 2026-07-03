import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

export default function SystemSettings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    // Simulate saving settings
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-wrapper">
        <header className="header">
          <h1 className="header-title">System Settings</h1>
        </header>

        <main className="content-container">
          {success && (
            <div className="alert-success" style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#a7f3d0',
              padding: '12px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '20px'
            }}>
              System settings successfully updated!
            </div>
          )}

          <div style={{ maxWidth: '800px' }}>
            <form onSubmit={handleSave} className="create-admin-form">
              
              <h3 className="details-section-title">General Preferences</h3>
              
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                <label className="checkbox-label" htmlFor="maintenance-mode-check" style={{ color: 'var(--text-main)' }}>
                  <input 
                    id="maintenance-mode-check"
                    type="checkbox" 
                    className="checkbox-input"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    disabled={saving}
                  />
                  Enable Maintenance Mode (Reject Client Registrations)
                </label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '28px', marginTop: '-10px' }}>
                  If active, the mobile application will display a maintenance message and suspend new order submissions.
                </p>

                <label className="checkbox-label" htmlFor="auto-approve-check" style={{ color: 'var(--text-main)', marginTop: '10px' }}>
                  <input 
                    id="auto-approve-check"
                    type="checkbox" 
                    className="checkbox-input"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    disabled={saving}
                  />
                  Auto-Approve Orders (Total Amount &lt; $50)
                </label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '28px', marginTop: '-10px' }}>
                  Automatically transition orders from "Pending" to "Approved" if total value is below threshold.
                </p>
              </div>

              <h3 className="details-section-title" style={{ marginTop: '20px' }}>Security &amp; Session Management</h3>
              
              <div className="form-group" style={{ marginBottom: '30px' }}>
                <label className="form-label" htmlFor="timeout-select">Admin Panel Session Timeout</label>
                <select 
                  id="timeout-select"
                  className="status-dropdown" 
                  style={{ width: '100%', maxWidth: '300px' }}
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  disabled={saving}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                </select>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                  Forces sign-out of admin session after inactivity.
                </p>
              </div>

              <h3 className="details-section-title" style={{ marginTop: '20px' }}>API Health Diagnostics</h3>
              <div style={{ display: 'flex', gap: '30px', margin: '20px 0 30px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }}></span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '500' }}>Backend Endpoint: ONLINE</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }}></span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '500' }}>Database Service: OPERATIONAL</span>
                </div>
              </div>

              <div className="form-actions" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: 'auto', minWidth: '180px' }}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="loading-spinner"></span>
                      Saving preferences...
                    </>
                  ) : (
                    'Save System Configuration'
                  )}
                </button>
              </div>

            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
