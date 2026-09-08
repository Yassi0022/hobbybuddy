import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import { API_BASE_URL } from '../utils/constants';
import AuthLayout from '../components/auth/AuthLayout';

/**
 * Password strength rules:
 *  - Minimum 8 characters
 *  - At least one uppercase letter OR one number
 */
function validatePassword(pw) {
  if (pw.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z0-9]/.test(pw)) return 'Include at least one uppercase letter or number';
  return null;
}

function validateEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
  return null;
}

/**
 * Compute a simple password strength score (0-3).
 */
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

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refId = searchParams.get('ref') || sessionStorage.getItem('hobbybuddy_ref');

  const strength = useMemo(() => passwordStrength(password), [password]);

  /** Live field-level validation as user types */
  const handleEmailChange = (value) => {
    setEmail(value);
    if (value && validateEmail(value)) {
      setFieldErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    } else {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (value && validatePassword(value)) {
      setFieldErrors((prev) => ({ ...prev, password: validatePassword(value) }));
    } else {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendStatus, setResendStatus] = useState(null); // null | 'sending' | 'sent' | 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // ── Client-side validation ──
    const errors = {};
    if (!name.trim()) errors.name = 'Name is required';
    if (!email) errors.email = 'Email is required';
    else if (validateEmail(email)) errors.email = validateEmail(email);
    if (!password) errors.password = 'Password is required';
    else if (validatePassword(password)) errors.password = validatePassword(password);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const userData = { name, email, password };
      if (refId) userData.referredBy = parseInt(refId);
      const data = await register(userData);
      // If the server returned a token, the user was auto-verified — go straight to dashboard
      if (data?.token) {
        showToast('Account created! Welcome to HobbyBuddy.', 'success');
        navigate('/dashboard');
        return;
      }
      if (window.plausible) window.plausible('Signup Completed');
      setRegisteredEmail(email);
      setRegistered(true);
    } catch (err) {
      const msg = err.message || 'Registration failed';
      // A genuine network/unknown failure (e.g. fetch throws a TypeError
      // like "Failed to fetch") reaches here unmodified — never surface
      // raw browser/network text to the user.
      const isNetworkError =
        err.name === 'TypeError' ||
        /failed to fetch|network|load failed/i.test(msg);
      if (err.isRateLimited) {
        setError({ message: msg, rateLimited: true });
      } else if (msg.toLowerCase().includes('email')) {
        setFieldErrors({ email: 'This email is already in use' });
      } else if (isNetworkError) {
        setError({
          message: 'We couldn’t create your account right now. Please try again in a moment.',
          rateLimited: false,
        });
      } else {
        setError({ message: msg, rateLimited: false });
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldErrorStyle = {
    display: 'block', fontSize: '0.78rem', color: '#dc2626', marginTop: 4, fontWeight: 500,
  };

  // ── Post-registration: prompt to verify email ──
  if (registered) {
    const handleResendVerification = async () => {
      setResendStatus('sending');
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/send-verification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: registeredEmail }),
        });
        setResendStatus(res.ok ? 'sent' : 'error');
      } catch {
        setResendStatus('error');
      }
    };

    return (
      <AuthLayout>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-icon" style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
            <i className="fas fa-envelope-open-text"></i>
          </div>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-subtitle">
            We sent a verification link to <strong>{registeredEmail}</strong>.
            Click the link to verify your account, then sign in.
          </p>

          {/* Next steps guidance */}
          <div style={{
            background: '#f8fafc', border: '1px solid var(--color-border)',
            borderRadius: 12, padding: '16px 20px', marginBottom: '20px', textAlign: 'left',
          }}>
            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '8px' }}>
              What to do next:
            </p>
            <ol style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', paddingLeft: '16px', margin: 0, lineHeight: 1.8 }}>
              <li>Open the verification email from HobbyBuddy</li>
              <li>Click the link inside — it lasts 24 hours</li>
              <li>Sign in and take your vibe quiz</li>
            </ol>
          </div>

          {/* Resend verification */}
          {resendStatus !== 'sent' ? (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendStatus === 'sending'}
              className="btn-secondary"
              style={{ marginBottom: '16px', minWidth: '220px' }}
            >
              {resendStatus === 'sending' ? (
                <><i className="fas fa-spinner fa-spin"></i> Sending…</>
              ) : (
                <><i className="fas fa-paper-plane"></i> Resend verification email</>
              )}
            </button>
          ) : (
            <p style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.88rem', marginBottom: '16px' }}>
              <i className="fas fa-check-circle"></i> Sent! Check your inbox.
            </p>
          )}
          {resendStatus === 'error' && (
            <p style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: '12px' }}>
              <i className="fas fa-exclamation-triangle"></i> Failed to send. Try again in a moment.
            </p>
          )}

          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
            <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
              <i className="fas fa-inbox" style={{ color: 'var(--color-text-light)' }}></i>
              Not in your inbox? Check your spam folder.
            </span>
          </p>

          <Link to="/login" className="btn-form-primary" style={{ display: 'inline-flex' }}>
            Go to Login <i className="fas fa-arrow-right" style={{ marginLeft: 8 }}></i>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-icon"><i className="fas fa-user-astronaut"></i></div>
        <h1 className="auth-title">Find your people</h1>
        <p className="auth-subtitle">Create your free profile, take the vibe quiz, and start meeting locals who get you.</p>

        {/* Progress steps */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '28px' }}>
          {['Create account', 'Take the quiz', 'Meet your people'].map((label, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 800,
                background: i === 0 ? 'var(--color-primary)' : 'var(--color-border)',
                color: i === 0 ? 'white' : 'var(--color-text-muted)',
              }}>
                {i + 1}
              </div>
              <span style={{ fontSize: '0.65rem', color: i === 0 ? 'var(--color-text-main)' : 'var(--color-text-muted)', fontWeight: 600 }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="reg-name"><i className="fas fa-user"></i> Name</label>
            <input type="text" id="reg-name" placeholder="Your name" required autoComplete="name"
              className={fieldErrors.name ? 'input-error' : undefined}
              value={name} onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: undefined })); }}
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? 'reg-name-error' : undefined}
            />
            {fieldErrors.name && <span id="reg-name-error" role="alert" style={fieldErrorStyle}>{fieldErrors.name}</span>}
            {!fieldErrors.name && name.trim() && <span style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: 4, fontWeight: 500 }}>✓ Looks good</span>}
          </div>
          <div className="form-group">
            <label htmlFor="reg-email"><i className="fas fa-envelope"></i> Email</label>
            <input type="email" id="reg-email" placeholder="you@example.com" required autoComplete="email"
              className={fieldErrors.email ? 'input-error' : undefined}
              value={email} onChange={(e) => handleEmailChange(e.target.value)}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'reg-email-error' : undefined}
            />
            {fieldErrors.email && <span id="reg-email-error" role="alert" style={fieldErrorStyle}>{fieldErrors.email}</span>}
            {!fieldErrors.email && email && !validateEmail(email) && <span style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: 4, fontWeight: 500 }}>✓ Valid email</span>}
          </div>
          <div className="form-group">
            <label htmlFor="reg-password"><i className="fas fa-lock"></i> Password</label>
            <input type="password" id="reg-password" placeholder="At least 8 characters" required autoComplete="new-password"
              className={fieldErrors.password ? 'input-error' : undefined}
              value={password} onChange={(e) => handlePasswordChange(e.target.value)}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'reg-password-error' : undefined}
            />
            {fieldErrors.password && <span id="reg-password-error" role="alert" style={fieldErrorStyle}>{fieldErrors.password}</span>}
            {/* Password strength meter */}
            {password.length > 0 && !fieldErrors.password && (
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
          {error && error.rateLimited && (
            <div className="form-error" style={{ display: 'block', background: '#fff7ed', borderColor: '#f59e0b', color: '#92400e' }} role="alert">
              <i className="fas fa-clock"></i> {error.message}
            </div>
          )}
          {error && !error.rateLimited && (
            <div className="form-error" style={{ display: 'block' }} role="alert">
              <i className="fas fa-exclamation-triangle"></i> {error.message}
            </div>
          )}
          <button type="submit" className="btn-form-primary" id="btn-register" disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Creating your account...</> : <>Create my free account <i className="fas fa-arrow-right"></i></>}
          </button>
        </form>
        <div className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></div>
      </div>
    </AuthLayout>
  );
}
