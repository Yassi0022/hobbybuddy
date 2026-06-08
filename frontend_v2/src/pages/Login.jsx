import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resendStatus, setResendStatus] = useState(null); // null | 'sending' | 'sent'
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnverified(false);
    setResendStatus(null);
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.quizCompleted === false) {
        navigate('/quiz');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.isRateLimited) {
        setError({ message: err.message, rateLimited: true });
      } else if (err.isUnverified) {
        setUnverified(true);
        setError({ message: err.message, rateLimited: false });
      } else {
        setError({ message: err.message, rateLimited: false });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendStatus('sending');
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setResendStatus('sent');
      } else {
        setResendStatus('error');
      }
    } catch {
      setResendStatus('error');
    }
  };

  return (
    <>
      <div className="bg-mesh"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>
      <nav className="navbar navbar-solid">
        <div className="nav-container">
          <Link to="/" className="logo"><i className="fas fa-users"></i><span>HobbyBuddy</span></Link>
          <ul className="nav-menu"><li><Link to="/register" className="cta-button">Join Now</Link></li></ul>
        </div>
      </nav>
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-icon"><i className="fas fa-sign-in-alt"></i></div>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to find your next real friendship</p>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="login-email"><i className="fas fa-envelope"></i> Email</label>
                <input
                  type="email" id="login-email" placeholder="you@example.com"
                  required autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="login-password"><i className="fas fa-lock"></i> Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password" placeholder="Your password"
                    required autoComplete="current-password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--color-text-muted)', fontSize: '0.9rem', padding: 4,
                    }}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {error && error.rateLimited && (
                <div className="form-error" style={{ display: 'block', background: '#fff7ed', borderColor: '#f59e0b', color: '#92400e' }} role="alert">
                  <i className="fas fa-clock"></i> {error.message}
                </div>
              )}
              {error && !error.rateLimited && !unverified && (
                <div className="form-error" style={{ display: 'block' }} role="alert">
                  <i className="fas fa-exclamation-triangle"></i> {error.message}
                </div>
              )}
              {error && unverified && (
                <div className="form-error" style={{ display: 'block', background: '#fff7ed', borderColor: '#f59e0b', color: '#92400e' }} role="alert">
                  <i className="fas fa-envelope-circle-xmark"></i> {error.message}
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendStatus === 'sending'}
                      style={{
                        background: 'none', border: '1px solid #f59e0b', borderRadius: 8,
                        padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600,
                        color: '#92400e', cursor: 'pointer',
                      }}
                    >
                      {resendStatus === 'sending' ? (
                        <><i className="fas fa-spinner fa-spin"></i> Sending…</>
                      ) : (
                        <><i className="fas fa-paper-plane"></i> Resend verification email</>
                      )}
                    </button>
                    {resendStatus === 'sent' && (
                      <span style={{ color: '#16a34a', fontSize: '0.8rem', marginLeft: 10 }}>
                        <i className="fas fa-check-circle"></i> Sent! Check your inbox.
                      </span>
                    )}
                    {resendStatus === 'error' && (
                      <span style={{ color: '#dc2626', fontSize: '0.8rem', marginLeft: 10 }}>
                        <i className="fas fa-exclamation-triangle"></i> Failed. Try again.
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button type="submit" className="btn-form-primary" id="btn-login" disabled={loading}>
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Signing in...</> : <><i className="fas fa-sign-in-alt"></i> Sign In Now</>}
              </button>
            </form>
            <div className="auth-footer" style={{ paddingTop: '20px' }}>Don't have an account yet? <Link to="/register">Join now</Link></div>
          </div>
        </div>
      </div>
      <footer style={{ padding: '40px 20px', textAlign: 'center', borderTop: '1px solid var(--color-border)', marginTop: '40px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Use</Link>
        </div>
        <p style={{ marginTop: '10px' }}>&copy; 2026 HobbyBuddy. Real friendships start here.</p>
      </footer>
    </>
  );
}
