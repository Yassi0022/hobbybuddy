import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../utils/constants';

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
    <>
      <div className="bg-mesh">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>
      <nav className="navbar navbar-solid">
        <div className="nav-container">
          <Link to="/" className="logo">
            <i className="fas fa-users"></i><span>HobbyBuddy</span>
          </Link>
          <ul className="nav-menu">
            <li><Link to="/login" className="cta-button">Sign In</Link></li>
          </ul>
        </div>
      </nav>

      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-icon"><i className="fas fa-key"></i></div>
            <h1 className="auth-title">Forgot password?</h1>
            <p className="auth-subtitle">
              No worries — enter your email and we'll send you a reset link.
            </p>

            {status === 'success' ? (
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
                padding: '20px', textAlign: 'center', marginTop: 16,
              }}>
                <i className="fas fa-envelope-circle-check" style={{ fontSize: '2rem', color: '#16a34a', marginBottom: 12 }}></i>
                <p style={{ color: '#15803d', fontWeight: 600, marginBottom: 8 }}>
                  Check your inbox
                </p>
                <p style={{ color: '#166534', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  If an account with that email exists, we've sent a password reset link.
                  It expires in 1 hour.
                </p>
                <Link to="/login" className="btn-form-primary" style={{ display: 'inline-block', marginTop: 16, textDecoration: 'none' }}>
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
        </div>
      </div>

      <footer style={{
        padding: '40px 20px', textAlign: 'center',
        borderTop: '1px solid var(--color-border)', marginTop: '40px',
        fontSize: '0.85rem', color: 'var(--color-text-muted)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Use</Link>
        </div>
        <p style={{ marginTop: '10px' }}>&copy; 2026 HobbyBuddy. Real friendships start here.</p>
      </footer>
    </>
  );
}
