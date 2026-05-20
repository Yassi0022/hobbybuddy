import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
      setError(err.message);
    } finally {
      setLoading(false);
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
            <h1 className="auth-title">Welcome Back!</h1>
            <p className="auth-subtitle">Sign in to discover your new matches and messages</p>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="login-email"><i className="fas fa-envelope"></i> Email</label>
                <input type="email" id="login-email" placeholder="you@example.com" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="login-password"><i className="fas fa-lock"></i> Password</label>
                <input type="password" id="login-password" placeholder="Your password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <div className="form-error" style={{ display: 'block' }} role="alert"><i className="fas fa-exclamation-triangle"></i> {error}</div>}
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
        <p style={{ marginTop: '10px' }}>&copy; 2026 HobbyBuddy. Matching friends by psychology.</p>
      </footer>
    </>
  );
}
