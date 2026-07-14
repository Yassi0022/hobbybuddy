import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Shared Navbar — used by all authenticated pages.
 *
 * Props:
 *   brandLink — where the logo links to (default: "/dashboard")
 *   showLinks — array of { to, label } objects for the nav menu
 */
export default function Navbar({ brandLink = '/dashboard', showLinks }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const defaultLinks = [
    { to: '/dashboard', label: 'Feed' },
    { to: '/discover', label: 'Discover' },
    { to: '/matches', label: 'Matches' },
    { to: '/messages', label: 'Messages' },
    { to: '/events', label: 'Events' },
    { to: '/profile', label: 'Profile' },
  ];

  const links = showLinks || defaultLinks;

  const isActive = (path) => location.pathname === path;

  // Close mobile menu on nav link click
  const handleLinkClick = () => setMobileOpen(false);

  return (
    <>
      <nav className="navbar navbar-solid">
        <div className="nav-container">
          <Link to={brandLink} className="logo" onClick={handleLinkClick}>
            <i className="fas fa-users"></i><span>HobbyBuddy</span>
          </Link>

          {/* Desktop + mobile slide-in menu */}
          <ul className={`nav-menu${mobileOpen ? ' active' : ''}`}>
            {links.map(link => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={isActive(link.to) ? 'active' : ''}
                  onClick={handleLinkClick}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Hamburger — visible only on mobile via CSS */}
          <button
            className={`hamburger${mobileOpen ? ' active' : ''}`}
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Click-away overlay for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 999, background: 'rgba(0,0,0,0.3)',
          }}
        />
      )}
    </>
  );
}
