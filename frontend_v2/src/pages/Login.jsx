import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import AuthLayout from '../components/auth/AuthLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resendStatus, setResendStatus] = useState(null); // null | 'sending' | 'sent'
  const [fieldErrors, setFieldErrors] = useState({});
  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnverified(false);
    setResendStatus(null);
    setFieldErrors({});

    const errors = {};
    if (!email) errors.email = 'Please enter your email.';
    if (!password) errors.password = 'Please enter your password.';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

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
        setError({ message: err.message, rateLimited: true, kind: 'rateLimited' });
      } else if (err.isUnverified) {
        setUnverified(true);
        setError({ message: err.message, rateLimited: false, kind: 'unverified' });
      } else if (err.status >= 500) {
        setError({ message: 'Server unreachable. Please try again later.', rateLimited: false, kind: 'server' });
      } else if (err.message && err.message.toLowerCase().includes('no account')) {
        setError({ message: err.message, rateLimited: false, kind: 'noAccount' });
      } else if (err.message && err.message.toLowerCase().includes('wrong password')) {
        setError({ message: err.message, rateLimited: false, kind: 'wrongPassword' });
      } else {
        setError({ message: 'Invalid email or password.', rateLimited: false, kind: 'generic' });
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
    <AuthLayout cta={<Link to="/register" className="cta-button">Join Now</Link>}>
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
              className={fieldErrors.email ? 'input-error' : undefined}
              value={email} onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
            />
            {fieldErrors.email && <span id="login-email-error" role="alert" style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: 4, fontWeight: 500, display: 'block' }}>{fieldErrors.email}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="login-password"><i className="fas fa-lock"></i> Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password" placeholder="Your password"
                required autoComplete="current-password"
                className={fieldErrors.password ? 'input-error' : undefined}
                value={password} onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                style={{ paddingRight: 44 }}
              />
              {fieldErrors.password && <span id="login-password-error" role="alert" style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: 4, fontWeight: 500, display: 'block' }}>{fieldErrors.password}</span>}
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

          <div style={{ textAlign: 'right', marginBottom: '12px' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>

          {error && error.rateLimited && (
            <div className="form-error" style={{ display: 'block', background: 'var(--color-error-bg, #fff7ed)', borderColor: 'var(--color-warning, #f59e0b)', color: 'var(--color-warning-text, #92400e)' }} role="alert">
              <i className="fas fa-clock"></i> {error.message}
            </div>
          )}
          {error && !error.rateLimited && !unverified && error.kind === 'noAccount' && (
            <div className="form-error" style={{ display: 'block', textAlign: 'left' }} role="alert">
              <i className="fas fa-exclamation-triangle"></i> {error.message}
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Don't have an account yet?</span>
                <Link to="/register" className="btn-primary" style={{ display: 'inline-flex', justifyContent: 'center', padding: '8px 16px', fontSize: '0.88rem' }}>
                  Create a free account <i className="fas fa-arrow-right" style={{ marginLeft: 6 }}></i>
                </Link>
              </div>
            </div>
          )}
          {error && !error.rateLimited && !unverified && error.kind === 'wrongPassword' && (
            <div className="form-error" style={{ display: 'block', textAlign: 'left' }} role="alert">
              <i className="fas fa-exclamation-triangle"></i> {error.message}
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--color-accent-warm)', fontWeight: 600, textDecoration: 'none' }}>
                  <i className="fas fa-key"></i> Reset your password
                </Link>
              </div>
            </div>
          )}
          {error && !error.rateLimited && !unverified && (error.kind === 'generic' || error.kind === 'server') && (
            <div className="form-error" style={{ display: 'block' }} role="alert">
              <i className="fas fa-exclamation-triangle"></i> {error.message}
            </div>
          )}
          {error && unverified && (
            <div className="form-error" style={{ display: 'block', background: 'var(--color-error-bg, #fff7ed)', borderColor: 'var(--color-warning, #f59e0b)', color: 'var(--color-warning-text, #92400e)' }} role="alert">
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

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => {
                loginAsDemo();
                navigate('/dashboard');
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(194, 65, 12, 0.3)',
                background: 'rgba(194, 65, 12, 0.05)',
                color: 'var(--color-primary, #c2410c)',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <i className="fas fa-sparkles"></i> Explore Demo Account (Instant Access)
            </button>
          </div>
        </form>
        <div className="auth-footer" style={{ paddingTop: '20px' }}>Don't have an account yet? <Link to="/register">Join now</Link></div>
      </div>
    </AuthLayout>
  );
}
