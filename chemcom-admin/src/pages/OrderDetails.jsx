import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth, BACKEND_URL } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

export default function OrderDetails() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found.');
        }
        throw new Error(`Failed to load order: ${response.statusText}`);
      }

      const data = await response.json();
      setOrder(data);
      setStatusInput(data.status);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching order details.');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (token && id) {
      fetchOrder();
    }
  }, [token, id, fetchOrder]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setUpdateSuccess(false);

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: statusInput,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to update order status.');
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);
      setStatusInput(updatedOrder.status);
      setUpdateSuccess(true);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update order status.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return '';
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
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'long',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link to="/" className="back-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </Link>
            <h1 className="header-title">Order Details #{id}</h1>
          </div>
        </header>

        <main className="content-container">
          {error && <div className="alert-error">{error}</div>}
          
          {updateSuccess && (
            <div className="alert-success" style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#a7f3d0',
              padding: '12px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '20px',
              animation: 'fadeIn 0.3s ease'
            }}>
              Order status successfully updated to {order?.status}!
            </div>
          )}

          {loading && !order ? (
            <div className="empty-state" style={{ padding: '80px' }}>
              <span className="loading-spinner" style={{ width: '30px', height: '30px', borderWidth: '3px' }}></span>
              <p style={{ marginTop: '15px' }}>Fetching order details...</p>
            </div>
          ) : !order ? (
            <div className="empty-state">
              <p>Order not found or was deleted.</p>
              <Link to="/" className="btn btn-primary" style={{ marginTop: '15px', display: 'inline-flex', width: 'auto' }}>
                Return to Dashboard
              </Link>
            </div>
          ) : (
            <div className="details-grid">
              
              {/* Left Side: Invoice Items & Customer details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                
                {/* Customer Card */}
                <div className="details-card">
                  <h3 className="details-section-title">Customer Information</h3>
                  <div className="customer-info-grid">
                    <div>
                      <div className="info-label">Customer Name</div>
                      <div className="info-value">{order.customer_name}</div>
                    </div>
                    <div>
                      <div className="info-label">Email Address</div>
                      <div className="info-value" style={{ wordBreak: 'break-all' }}>
                        {order.customer_email || 'No email address provided'}
                      </div>
                    </div>
                    <div>
                      <div className="info-label">Purchase Date</div>
                      <div className="info-value">{formatDate(order.created_at)}</div>
                    </div>
                  </div>
                </div>

                {/* Items List Card */}
                <div className="details-card">
                  <h3 className="details-section-title">Items In Order</h3>
                  <div className="order-items-list">
                    {order.items && order.items.map((item, idx) => (
                      <div key={idx} className="order-item-row">
                        <div className="item-details">
                          <span className="item-name">{item.name}</span>
                          <span className="item-qty-price">
                            {item.quantity} × {formatPrice(item.price)}
                          </span>
                        </div>
                        <span className="item-total">
                          {formatPrice(item.quantity * item.price)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="order-total-bar">
                    <span className="total-label">Total Amount Paid</span>
                    <span className="total-value">{formatPrice(order.total_amount)}</span>
                  </div>
                </div>

              </div>

              {/* Right Side: Status Update Pane */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                
                <div className="details-card">
                  <h3 className="details-section-title">Workflow Status</h3>
                  
                  <div className="status-update-card">
                    <div>
                      <div className="info-label" style={{ marginBottom: '8px' }}>Current Status</div>
                      <span className={`badge ${getStatusBadgeClass(order.status)}`} style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                        {order.status}
                      </span>
                    </div>

                    <div style={{ height: '1px', background: 'var(--border-light)', margin: '5px 0' }}></div>

                    <form onSubmit={handleStatusUpdate}>
                      <div className="form-group" style={{ marginBottom: '15px' }}>
                        <label className="form-label" htmlFor="status-select">Update Status</label>
                        <select 
                          id="status-select"
                          className="status-dropdown"
                          value={statusInput}
                          onChange={(e) => setStatusInput(e.target.value)}
                          disabled={updating}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Completed">Completed</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>

                      <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={updating || statusInput === order.status}
                        style={{ opacity: statusInput === order.status ? 0.6 : 1 }}
                      >
                        {updating ? (
                          <>
                            <span className="loading-spinner"></span>
                            Saving...
                          </>
                        ) : (
                          'Save Status'
                        )}
                      </button>
                    </form>
                  </div>
                </div>

              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
