import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../utils/constants';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error | invalid
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password) {
      setErrorMsg('Please enter a new password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setErrorMsg(data.error || 'Failed to reset password. The link may have expired.');
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
            <div className="auth-icon"><i className="fas fa-lock-open"></i></div>
            <h1 className="auth-title">Reset password</h1>
            <p className="auth-subtitle">
              Enter your new password below.
            </p>

            {status === 'invalid' ? (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
                padding: '20px', textAlign: 'center', marginTop: 16,
              }}>
                <i className="fas fa-triangle-exclamation" style={{ fontSize: '2rem', color: '#dc2626', marginBottom: 12 }}></i>
                <p style={{ color: '#b91c1c', fontWeight: 600, marginBottom: 8 }}>
                  Invalid or missing reset link
                </p>
                <p style={{ color: '#991b1b', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  This password reset link is invalid or has expired.
                  Please request a new one.
                </p>
                <Link to="/forgot-password" className="btn-form-primary" style={{ display: 'inline-block', marginTop: 16, textDecoration: 'none' }}>
                  <i className="fas fa-key"></i> Request new link
                </Link>
              </div>
            ) : status === 'success' ? (
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
                padding: '20px', textAlign: 'center', marginTop: 16,
              }}>
                <i className="fas fa-check-circle" style={{ fontSize: '2rem', color: '#16a34a', marginBottom: 12 }}></i>
                <p style={{ color: '#15803d', fontWeight: 600, marginBottom: 8 }}>
                  Password reset successful!
                </p>
                <p style={{ color: '#166534', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  Your password has been updated. You can now sign in with your new password.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="btn-form-primary"
                  style={{ marginTop: 16, cursor: 'pointer' }}
                >
                  <i className="fas fa-sign-in-alt"></i> Go to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label htmlFor="reset-password">
                    <i className="fas fa-lock"></i> New password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="reset-password"
                      placeholder="At least 6 characters"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

                <div className="form-group">
                  <label htmlFor="reset-confirm">
                    <i className="fas fa-lock"></i> Confirm new password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="reset-confirm"
                    placeholder="Re-enter your new password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {status === 'error' && errorMsg && (
                  <div className="form-error" style={{ display: 'block' }} role="alert">
                    <i className="fas fa-exclamation-triangle"></i> {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-form-primary"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <><i className="fas fa-spinner fa-spin"></i> Resetting...</>
                  ) : (
                    <><i className="fas fa-check"></i> Reset password</>
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
