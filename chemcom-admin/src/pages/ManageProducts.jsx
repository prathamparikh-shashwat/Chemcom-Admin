import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, BACKEND_URL } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

export default function ManageProducts() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Active', 'Inactive'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // Null for create mode, product object for edit mode

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/products/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load products: ${response.statusText}`);
      }

      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while loading products.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token, fetchProducts]);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setIsActive(true);
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(product.price);
    setIsActive(product.is_active);
    setImageFile(null);
    setImagePreview(product.photo_url || '');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price) {
      setError('Product name and price are required.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', parseFloat(price).toString());
      formData.append('is_active', isActive.toString());
      if (imageFile) {
        formData.append('file', imageFile);
      }

      let response;
      if (editingProduct) {
        // Edit mode
        response = await fetch(`${BACKEND_URL}/api/v1/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
      } else {
        // Create mode
        response = await fetch(`${BACKEND_URL}/api/v1/products/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Failed to ${editingProduct ? 'update' : 'create'} product.`);
      }

      const savedProduct = await response.json();
      setSuccessMsg(`Product "${savedProduct.name}" successfully ${editingProduct ? 'updated' : 'created'}!`);
      setIsModalOpen(false);
      
      // Auto-hide success message
      setTimeout(() => setSuccessMsg(''), 4000);

      // Refresh list
      await fetchProducts();
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during form submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (product) => {
    setError('');
    setSuccessMsg('');
    const newActiveState = !product.is_active;

    try {
      let response;
      if (!newActiveState) {
        // Deactivate (soft delete via DELETE)
        response = await fetch(`${BACKEND_URL}/api/v1/products/${product.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } else {
        // Reactivate (PUT is_active: true)
        const formData = new FormData();
        formData.append('is_active', 'true');
        response = await fetch(`${BACKEND_URL}/api/v1/products/${product.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Failed to update product state.`);
      }

      setSuccessMsg(`Product "${product.name}" is now ${newActiveState ? 'active' : 'inactive'}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await fetchProducts();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to toggle product status.');
    }
  };

  const filteredProducts = products.filter(product => {
    // Status Filter
    const matchesStatus = 
      statusFilter === 'All' ||
      (statusFilter === 'Active' && product.is_active) ||
      (statusFilter === 'Inactive' && !product.is_active);

    // Search query
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const formatPrice = (p) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(p);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-wrapper">
        <header className="header">
          <h1 className="header-title">Manage Products</h1>
          <button 
            onClick={handleOpenCreateModal} 
            className="btn btn-primary"
            style={{ width: 'auto', padding: '8px 20px', fontSize: '0.85rem' }}
          >
            Add New Product
          </button>
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
              marginBottom: '20px',
              animation: 'fadeIn 0.3s ease'
            }}>
              {successMsg}
            </div>
          )}

          {/* Controls: Search and Status Filter */}
          <div className="controls-bar">
            <div className="search-group" style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '400px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search products by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              />
            </div>
            
            <div className="filter-group">
              {['All', 'Active', 'Inactive'].map(status => (
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

          {/* Products List Table */}
          <div className="table-container">
            {loading && products.length === 0 ? (
              <div className="empty-state" style={{ padding: '80px' }}>
                <span className="loading-spinner" style={{ width: '30px', height: '30px', borderWidth: '3px' }}></span>
                <p style={{ marginTop: '15px' }}>Loading products list...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px', color: 'var(--text-dim)' }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <p>No products found matching the filter "{statusFilter}".</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th className="th" style={{ width: '80px' }}>Photo</th>
                    <th className="th" style={{ width: '80px' }}>ID</th>
                    <th className="th">Product Name</th>
                    <th className="th">Price</th>
                    <th className="th">Status</th>
                    <th className="th">Created Date</th>
                    <th className="th" style={{ width: '180px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="tr">
                      <td className="td">
                        {product.photo_url ? (
                          <img 
                            src={product.photo_url} 
                            alt={product.name} 
                            className="product-thumbnail"
                          />
                        ) : (
                          <div className="product-placeholder-thumbnail">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="td" style={{ fontWeight: '600', color: 'white' }}>#{product.id}</td>
                      <td className="td">
                        <div style={{ fontWeight: '600', color: 'white' }}>{product.name}</div>
                        {product.description && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td className="td" style={{ fontWeight: '600', color: 'var(--primary)' }}>{formatPrice(product.price)}</td>
                      <td className="td">
                        <span className={`badge ${product.is_active ? 'badge-completed' : 'badge-rejected'}`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="td" style={{ fontSize: '0.85rem' }}>{formatDate(product.created_at)}</td>
                      <td className="td">
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button 
                            onClick={() => handleOpenEditModal(product)} 
                            className="action-link"
                            style={{ background: 'none', border: 'none', font: 'inherit', padding: 0 }}
                          >
                            Edit
                          </button>
                          <span style={{ color: 'var(--border-light)' }}>|</span>
                          <button 
                            onClick={() => handleToggleActive(product)} 
                            className="action-link"
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              font: 'inherit', 
                              padding: 0,
                              color: product.is_active ? 'var(--danger)' : 'var(--success)'
                            }}
                          >
                            {product.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* Add / Edit Product Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProduct ? 'Edit Product Details' : 'Register New Product'}
              </h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert-error" style={{ marginBottom: '15px' }}>{error}</div>}

                <div className="form-group">
                  <label className="form-label" htmlFor="product-name">Product Name *</label>
                  <input
                    id="product-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Hydrochloric Acid 37%"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="product-description">Description</label>
                  <textarea
                    id="product-description"
                    className="form-input"
                    placeholder="Provide details about grades, safety information, or application guidelines..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={submitting}
                    rows="3"
                    style={{ resize: 'vertical', minHeight: '80px' }}
                  />
                </div>

                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label className="form-label" htmlFor="product-price">Unit Price (INR) *</label>
                    <input
                      id="product-price"
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="e.g. 45.50"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
                    <label className="checkbox-label" htmlFor="product-active">
                      <input
                        id="product-active"
                        type="checkbox"
                        className="checkbox-input"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        disabled={submitting}
                      />
                      Is Active
                    </label>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '20px' }}>
                  <label className="form-label">Product Image</label>
                  <div className="image-upload-wrapper">
                    <div className="image-preview-container">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" />
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-dim)' }}>
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="product-image" className="image-upload-btn-label">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Choose Photo Image
                      </label>
                      <input
                        id="product-image"
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        disabled={submitting}
                        style={{ display: 'none' }}
                      />
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                        Supports JPG, PNG, WEBP. Uploads to Cloudinary.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: 'auto', padding: '10px 20px', fontSize: '0.85rem' }}
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: 'auto', padding: '10px 24px', fontSize: '0.85rem', minWidth: '130px' }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="loading-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    editingProduct ? 'Update Product' : 'Add Product'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
