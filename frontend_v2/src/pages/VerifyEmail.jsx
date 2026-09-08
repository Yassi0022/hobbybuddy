import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/constants';

/**
 * VerifyEmail — handles the email verification link.
 *
 * Route: /verify?token=<verification-token>
 *
 * Calls GET /api/users/verify?token=... and shows success or error.
 * On success, redirects to login after a short delay.
 * On error, offers to resend the verification email.
 */
export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token ? '' : 'No verification token found. Please check your email link.');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState(null); // null | 'sending' | 'sent' | 'error'

  const verifyToken = async (t) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/verify?token=${encodeURIComponent(t)}`);
      const data = await res.json();
      if (res.ok && data.verified) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Verification failed. The link may have expired.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  useEffect(() => {
    if (token) {
      const timer = setTimeout(() => verifyToken(token), 0);
      return () => clearTimeout(timer);
    }
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail.trim()) return;
    setResendStatus('sending');
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail.trim() }),
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
        </div>
      </nav>

      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            {status === 'loading' && (
              <>
                <div className="auth-icon">
                  <i className="fas fa-spinner fa-spin"></i>
                </div>
                <h1 className="auth-title">Verifying your email…</h1>
                <p className="auth-subtitle">Just a moment.</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="auth-icon" style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
                  <i className="fas fa-check"></i>
                </div>
                <h1 className="auth-title">Email verified! 🎉</h1>
                <p className="auth-subtitle">{message}</p>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: 12 }}>
                  Redirecting to login…
                </p>
                <Link to="/login" className="btn-form-primary" style={{ marginTop: 20, display: 'inline-flex' }}>
                  Go to Login <i className="fas fa-arrow-right" style={{ marginLeft: 8 }}></i>
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="auth-icon" style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
                  <i className="fas fa-envelope-circle-xmark"></i>
                </div>
                <h1 className="auth-title">Verification failed</h1>
                <p className="auth-subtitle">{message}</p>

                <div style={{ marginTop: 28, textAlign: 'left' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>
                    Enter your email to resend the verification link:
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      style={{
                        flex: 1, padding: '10px 14px', borderRadius: 10,
                        border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                        color: 'var(--color-text-main)', fontSize: '0.9rem', outline: 'none',
                      }}
                    />
                    <button
                      className="btn-primary"
                      onClick={handleResend}
                      disabled={resendStatus === 'sending' || !resendEmail.trim()}
                      style={{ padding: '10px 18px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                    >
                      {resendStatus === 'sending' ? (
                        <><i className="fas fa-spinner fa-spin"></i> Sending…</>
                      ) : (
                        <><i className="fas fa-paper-plane"></i> Resend</>
                      )}
                    </button>
                  </div>
                  {resendStatus === 'sent' && (
                    <p style={{ color: '#16a34a', fontSize: '0.82rem', marginTop: 8 }}>
                      <i className="fas fa-check-circle"></i> Verification email sent! Check your inbox.
                    </p>
                  )}
                  {resendStatus === 'error' && (
                    <p style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: 8 }}>
                      <i className="fas fa-exclamation-triangle"></i> Failed to send. Please try again.
                    </p>
                  )}
                </div>

                <div style={{ marginTop: 24 }}>
                  <Link to="/login" style={{ color: 'var(--color-accent-warm)', fontSize: '0.85rem', fontWeight: 600 }}>
                    ← Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
