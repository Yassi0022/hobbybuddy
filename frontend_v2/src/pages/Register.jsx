import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refId = searchParams.get('ref') || sessionStorage.getItem('hobbybuddy_ref');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const userData = { name, email, password };
      if (refId) userData.referredBy = parseInt(refId);
      await register(userData);
      navigate('/quiz');
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
          <ul className="nav-menu"><li><Link to="/login" className="cta-button">Sign In</Link></li></ul>
        </div>
      </nav>
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-icon"><i className="fas fa-user-astronaut"></i></div>
            <h1 className="auth-title">Join the Community</h1>
            <p className="auth-subtitle">Create your secure profile and unlock the personality test.</p>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="reg-name"><i className="fas fa-user"></i> Name</label>
                <input type="text" id="reg-name" placeholder="Your name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="reg-email"><i className="fas fa-envelope"></i> Email</label>
                <input type="email" id="reg-email" placeholder="you@example.com" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="reg-password"><i className="fas fa-lock"></i> Password</label>
                <input type="password" id="reg-password" placeholder="Create a strong password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <div className="form-error" style={{ display: 'block' }} role="alert"><i className="fas fa-exclamation-triangle"></i> {error}</div>}
              <button type="submit" className="btn-form-primary" id="btn-register" disabled={loading}>
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Creating...</> : <>Discover your personality <i className="fas fa-arrow-right"></i></>}
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
        <p style={{ marginTop: '10px' }}>&copy; 2026 HobbyBuddy. Science-backed social matching.</p>
      </footer>
    </>
  );
}
