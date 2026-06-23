import { Link } from 'react-router-dom';

/**
 * AuthLayout — shared shell for all auth pages.
 * Renders the background mesh, top nav, card wrapper, and footer.
 * Children is the page-specific form/content (typically an auth-card).
 *
 * @param {ReactNode} children — the inner auth-card content
 * @param {ReactNode} [cta] — optional nav CTA link (e.g. <Link to="/login">Sign In</Link>)
 */
export default function AuthLayout({ children, cta = <Link to="/login" className="cta-button">Sign In</Link> }) {
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
          {cta && <ul className="nav-menu"><li>{cta}</li></ul>}
        </div>
      </nav>

      <div className="auth-page">
        <div className="auth-container">
          {children}
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
        <p style={{ marginTop: '10px' }}>&copy; {new Date().getFullYear()} HobbyBuddy. Real friendships start here.</p>
      </footer>
    </>
  );
}
