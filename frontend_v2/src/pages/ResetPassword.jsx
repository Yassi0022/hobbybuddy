import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../utils/constants';
import AuthLayout from '../components/auth/AuthLayout';

function passwordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: 'transparent' };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++;
  if (pw.length >= 12 && /[^A-Za-z0-9]/.test(pw)) s++;
  if (s === 0) return { score: 1, label: 'Weak', color: '#dc2626' };
  if (s === 1) return { score: 2, label: 'Fair', color: '#d97706' };
  if (s === 2) return { score: 3, label: 'Good', color: '#16a34a' };
  return { score: 3, label: 'Strong', color: '#059669' };
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(token ? 'idle' : 'invalid'); // idle | loading | success | error | invalid
  const [errorMsg, setErrorMsg] = useState('');

  const strength = useMemo(() => passwordStrength(password), [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password) {
      setStatus('error');
      setErrorMsg('Please enter a new password.');
      return;
    }
    if (password.length < 8) {
      setStatus('error');
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setStatus('error');
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
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-icon"><i className="fas fa-lock-open"></i></div>
        <h1 className="auth-title">Reset password</h1>
        <p className="auth-subtitle">
          Enter your new password below.
        </p>

        {status === 'invalid' ? (
          <div role="alert" style={{
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
            padding: '24px 20px', textAlign: 'center', marginTop: 16,
          }}>
            <i className="fas fa-check-circle" style={{ fontSize: '2rem', color: '#16a34a', marginBottom: 12 }}></i>
            <p style={{ color: '#15803d', fontWeight: 600, marginBottom: 8 }}>
              Password reset successful!
            </p>
            <p style={{ color: '#166534', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '20px' }}>
              Your password has been updated. You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn-form-primary"
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
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
                  placeholder="At least 8 characters"
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
              {password.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: i <= strength.score ? strength.color : '#e5e7eb',
                        transition: 'background 0.2s',
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: strength.color, fontWeight: 600 }}>
                    {strength.label}
                  </span>
                </div>
              )}
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
    </AuthLayout>
  );
}
