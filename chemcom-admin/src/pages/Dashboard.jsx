import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, BACKEND_URL } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch stats
      const statsResponse = await fetch(`${BACKEND_URL}/api/v1/orders/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!statsResponse.ok) {
        throw new Error(`Failed to load stats: ${statsResponse.statusText}`);
      }
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch orders
      const ordersResponse = await fetch(`${BACKEND_URL}/api/v1/orders/?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!ordersResponse.ok) {
        throw new Error(`Failed to load orders: ${ordersResponse.statusText}`);
      }
      const ordersData = await ordersResponse.json();
      setOrders(ordersData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  const filteredOrders = statusFilter === 'All' 
    ? orders 
    : orders.filter(order => order.status.toLowerCase() === statusFilter.toLowerCase());

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'badge-pending';
      case 'approved': return 'badge-approved';
      case 'completed': return 'badge-completed';
      case 'rejected': return 'badge-rejected';
      default: return '';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-wrapper">
        <header className="header">
          <h1 className="header-title">Dashboard Overview</h1>
          <button 
            onClick={fetchData} 
            className="btn btn-secondary" 
            style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
            disabled={loading}
          >
            {loading ? <span className="loading-spinner" style={{ width: '12px', height: '12px' }}></span> : null}
            Refresh Data
          </button>
        </header>

        <main className="content-container">
          {error && <div className="alert-error">{error}</div>}

          {/* Stats Summary Section */}
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Orders</div>
              <div className="stat-value">{stats ? stats.total_orders : '-'}</div>
            </div>
            <div className="stat-card pending">
              <div className="stat-label">Pending</div>
              <div className="stat-value">{stats ? stats.pending_orders : '-'}</div>
            </div>
            <div className="stat-card approved">
              <div className="stat-label">Approved</div>
              <div className="stat-value">{stats ? stats.approved_orders : '-'}</div>
            </div>
            <div className="stat-card completed">
              <div className="stat-label">Completed</div>
              <div className="stat-value">{stats ? stats.completed_orders : '-'}</div>
            </div>
            <div className="stat-card rejected">
              <div className="stat-label">Rejected</div>
              <div className="stat-value">{stats ? stats.rejected_orders : '-'}</div>
            </div>
          </section>

          {/* Customer Orders Management Header & Filters */}
          <div className="controls-bar">
            <h2>Customer Orders</h2>
            
            <div className="filter-group">
              {['All', 'Pending', 'Approved', 'Completed', 'Rejected'].map(status => (
                <button
                  key={status}
                  className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table Container */}
          <div className="table-container">
            {loading && orders.length === 0 ? (
              <div className="empty-state" style={{ padding: '60px' }}>
                <span className="loading-spinner" style={{ width: '30px', height: '30px', borderWidth: '3px' }}></span>
                <p style={{ marginTop: '15px' }}>Loading orders from system...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px', color: 'var(--text-dim)' }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <p>No orders found matching the filter "{statusFilter}".</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th className="th">Order ID</th>
                    <th className="th">Customer Name</th>
                    <th className="th">Customer Email</th>
                    <th className="th">Order Date</th>
                    <th className="th">Total Amount</th>
                    <th className="th">Status</th>
                    <th className="th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="tr">
                      <td className="td" style={{ fontWeight: '600', color: 'white' }}>#{order.id}</td>
                      <td className="td">{order.customer_name}</td>
                      <td className="td" style={{ color: 'var(--text-muted)' }}>{order.customer_email || 'No email provided'}</td>
                      <td className="td" style={{ fontSize: '0.85rem' }}>{formatDate(order.created_at)}</td>
                      <td className="td" style={{ fontWeight: '600', color: 'var(--primary)' }}>{formatPrice(order.total_amount)}</td>
                      <td className="td">
                        <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="td">
                        <Link to={`/orders/${order.id}`} className="action-link">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
