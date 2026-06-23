import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../utils/constants';
import AuthLayout from '../components/auth/AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [retryAfter, setRetryAfter] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setRetryAfter(0);

    if (!email || !email.trim()) {
      setStatus('error');
      setErrorMsg('Please enter your email address.');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        setStatus('success');
      } else if (res.status === 429) {
        const retry = parseInt(res.headers.get('Retry-After') || '900', 10);
        setRetryAfter(retry);
        const minutes = Math.ceil(retry / 60);
        setStatus('error');
        setErrorMsg(`Too many requests. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`);
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please check your connection and try again.');
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-icon"><i className="fas fa-key"></i></div>
        <h1 className="auth-title">Forgot password?</h1>
        <p className="auth-subtitle">
          No worries — enter your email and we'll send you a reset link.
        </p>

        {status === 'success' ? (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
            padding: '24px 20px', textAlign: 'center', marginTop: 16,
          }}>
            <i className="fas fa-envelope-circle-check" style={{ fontSize: '2rem', color: '#16a34a', marginBottom: 12 }}></i>
            <p style={{ color: '#15803d', fontWeight: 600, marginBottom: 8 }}>
              Check your inbox
            </p>
            <p style={{ color: '#166534', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '8px' }}>
              If an account with that email exists, we've sent a password reset link.
              It expires in 1 hour.
            </p>
            <p style={{ color: '#166534', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '16px' }}>
              <i className="fas fa-inbox" style={{ marginRight: '4px' }}></i>
              Not seeing it? Check your spam folder.
            </p>
            <Link to="/login" className="btn-form-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <i className="fas fa-arrow-left"></i> Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="forgot-email">
                <i className="fas fa-envelope"></i> Email
              </label>
              <input
                type="email"
                id="forgot-email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {status === 'error' && errorMsg && (
              <div className="form-error" style={{
                display: 'block',
                background: retryAfter > 0 ? '#fff7ed' : undefined,
                borderColor: retryAfter > 0 ? '#f59e0b' : undefined,
                color: retryAfter > 0 ? '#92400e' : undefined,
              }} role="alert">
                <i className={`fas ${retryAfter > 0 ? 'fa-clock' : 'fa-exclamation-triangle'}`}></i> {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="btn-form-primary"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <><i className="fas fa-spinner fa-spin"></i> Sending...</>
              ) : (
                <><i className="fas fa-paper-plane"></i> Send reset link</>
              )}
            </button>
          </form>
        )}

        <div className="auth-footer" style={{ paddingTop: '20px' }}>
          Remember your password? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </AuthLayout>
  );
}
