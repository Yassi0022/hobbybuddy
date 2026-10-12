import { Link } from 'react-router-dom';

export default function CookiePolicy() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base, #faf9f6)', padding: '3rem 1.5rem 5rem' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        <Link 
          to="/" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: 'var(--color-primary, #c2410c)', 
            fontWeight: 600, 
            textDecoration: 'none', 
            marginBottom: '2.5rem',
            padding: '8px 16px',
            background: 'rgba(194, 65, 12, 0.08)',
            borderRadius: '999px',
            fontSize: '0.9rem'
          }}
        >
          <i className="fas fa-arrow-left"></i> Back to Home
        </Link>

        <header style={{ marginBottom: '2.5rem' }}>
          <span style={{ 
            display: 'inline-block',
            padding: '4px 12px', 
            borderRadius: '999px', 
            background: 'rgba(194, 65, 12, 0.1)', 
            color: 'var(--color-primary, #c2410c)', 
            fontSize: '0.8rem', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            marginBottom: '0.75rem'
          }}>
            Transparency & Compliance
          </span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-ink, #1a1a2e)', marginBottom: '0.5rem' }}>
            Cookie Policy
          </h1>
          <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Last updated: May 2026</div>
        </header>

        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '2.5rem',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          lineHeight: 1.8,
          color: '#475569'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.5rem', borderLeft: '4px solid #c2410c', paddingLeft: '12px' }}>
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are small text files stored on your browser when visiting websites. They help websites remember preferences, keep you securely signed in, and analyze high-level performance without tracking your personal life.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.5rem', borderLeft: '4px solid #c2410c', paddingLeft: '12px' }}>
              2. How HobbyBuddy Uses Cookies
            </h2>
            <p>
              We believe in minimal data footprint. HobbyBuddy strictly uses essential cookies and local storage tokens required for:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li><strong>Authentication & Security:</strong> Retaining your encrypted session tokens safely so you remain logged in.</li>
              <li><strong>User Preferences:</strong> Storing temporary quiz state and UI settings.</li>
              <li><strong>Privacy-Friendly Analytics:</strong> We use lightweight, cookie-less privacy analytics (Plausible) which is 100% GDPR-compliant and never tracks you across the web.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.5rem', borderLeft: '4px solid #c2410c', paddingLeft: '12px' }}>
              3. No Third-Party Advertising Trackers
            </h2>
            <p>
              We <strong>do not</strong> use third-party advertising cookies, Facebook pixels, or data broker trackers. Your personality data and hobbies will never be monetized or sold to advertisers.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.5rem', borderLeft: '4px solid #c2410c', paddingLeft: '12px' }}>
              4. Managing Your Cookies
            </h2>
            <p>
              You can block or clear cookies via your browser settings at any time (Chrome, Safari, Firefox, Edge). Note that clearing session storage will log you out of HobbyBuddy.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.5rem', borderLeft: '4px solid #c2410c', paddingLeft: '12px' }}>
              5. Questions?
            </h2>
            <p>
              If you have any questions regarding our cookie and privacy policies, reach out to us at <a href="mailto:privacy@hobbybuddy.app" style={{ color: '#c2410c', fontWeight: 600 }}>privacy@hobbybuddy.app</a> or visit our <Link to="/contact" style={{ color: '#c2410c', fontWeight: 600 }}>Contact page</Link>.
            </p>
          </div>
        </div>

        <footer style={{ marginTop: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
          &copy; {new Date().getFullYear()} HobbyBuddy. Built for genuine, real-world connections.
        </footer>
      </div>
    </div>
  );
}
