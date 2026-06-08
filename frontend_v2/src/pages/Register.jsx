import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
  }

  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

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
      await register(userData);
      setRegisteredEmail(email);
      setRegistered(true);
    } catch (err) {
      const msg = err.message || 'Registration failed';
      if (err.isRateLimited) {
        setError({ message: msg, rateLimited: true });
      } else if (msg.toLowerCase().includes('email')) {
        setFieldErrors({ email: 'This email is already in use' });
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
    return (
      <>
        <div className="bg-mesh"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>
        <nav className="navbar navbar-solid">
          <div className="nav-container">
            <Link to="/" className="logo"><i className="fas fa-users"></i><span>HobbyBuddy</span></Link>
          </div>
        </nav>
        <div className="auth-page">
          <div className="auth-container">
            <div className="auth-card" style={{ textAlign: 'center' }}>
              <div className="auth-icon" style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
                <i className="fas fa-envelope-open-text"></i>
              </div>
              <h1 className="auth-title">Check your email</h1>
              <p className="auth-subtitle">
                We sent a verification link to <strong>{registeredEmail}</strong>.
                Click the link to verify your account, then sign in.
              </p>
              <Link to="/login" className="btn-form-primary" style={{ marginTop: 20, display: 'inline-flex' }}>
                Go to Login <i className="fas fa-arrow-right" style={{ marginLeft: 8 }}></i>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="bg-mesh"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>
      <nav className="navbar navbar-solid">
        <div className="nav-container">
          <Link to="/" className="logo"><i className="fas fa-users"></i><span>HobbyBuddy</span></Link>
          <ul className="nav-menu"><li><Link to="/login" className="cta-button">Sign In</Link></li></ul>
        </div>
      </nav>
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-icon"><i className="fas fa-user-astronaut"></i></div>
            <h1 className="auth-title">Find your people</h1>
            <p className="auth-subtitle">Create your profile and discover your vibe archetype.</p>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="reg-name"><i className="fas fa-user"></i> Name</label>
                <input type="text" id="reg-name" placeholder="Your name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                {fieldErrors.name && <span style={fieldErrorStyle}>{fieldErrors.name}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="reg-email"><i className="fas fa-envelope"></i> Email</label>
                <input type="email" id="reg-email" placeholder="you@example.com" required autoComplete="email" value={email} onChange={(e) => handleEmailChange(e.target.value)} />
                {fieldErrors.email && <span style={fieldErrorStyle}>{fieldErrors.email}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="reg-password"><i className="fas fa-lock"></i> Password</label>
                <input type="password" id="reg-password" placeholder="Min 8 chars, with uppercase or number" required autoComplete="new-password" value={password} onChange={(e) => handlePasswordChange(e.target.value)} />
                {fieldErrors.password && <span style={fieldErrorStyle}>{fieldErrors.password}</span>}
                {/* Password strength meter */}
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
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Creating...</> : <>Get started <i className="fas fa-arrow-right"></i></>}
              </button>
            </form>
            <div className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></div>
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
