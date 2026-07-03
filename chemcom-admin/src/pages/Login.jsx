import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // If user is already authenticated and has superuser rights, redirect to dashboard
  useEffect(() => {
    if (user && user.is_superuser) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const result = await login(email, password);

    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Authentication failed.');
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background-glow"></div>
      
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">ChemCom</div>
          <p className="auth-subtitle">Admin Web Portal</p>
        </div>

        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">
              Admin Email
            </label>
            <input
              id="email-input"
              type="email"
              className="form-input"
              placeholder="name@chemcom.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">
              Password
            </label>
            <input
              id="password-input"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ marginTop: '10px' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading-spinner"></span>
                Signing In...
              </>
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
