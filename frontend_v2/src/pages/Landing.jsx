import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import styles from '../styles/landing.module.css';

export default function Landing() {
  const navbarRef = useRef(null);
  const [searchParams] = useSearchParams();
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const sectionRefs = useRef([]);

  /* ── Referral param persistence ── */
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) sessionStorage.setItem('hobbybuddy_ref', ref);
  }, [searchParams]);

  /* ── Navbar scroll state ── */
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      if (navbarRef.current) {
        navbarRef.current.classList.toggle('scrolled', window.scrollY > 60);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ── Section visibility observer ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.dataset.section]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, []);

  const isVisible = (section) => visibleSections.has(section);


  return (
    <>
      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className={styles.landingNav} ref={navbarRef}>
        <div className={styles.navInner}>
          <Link to="/" className={styles.navLogo}>
            <i className="fas fa-users"></i>
            <span>HobbyBuddy</span>
          </Link>
          <div className={styles.navActions}>
            <Link to="/login" className={styles.navSignIn}>Sign In</Link>
            <Link to="/register" className={styles.navCta}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main>

        {/* ═══════════ HERO ═══════════ */}
        <section className={styles.heroSection}>

          <div className={styles.heroGrid}>

            {/* Left — Text content */}
            <div className={styles.heroContent}>
              <div className={styles.heroTag}>
                <span className={styles.heroTagDot}></span>
                Friendships start here
              </div>

              <h1 className={styles.heroTitle}>
                Find your people.
                <span className={styles.heroTitleAccent}>Your vibe attracts your tribe.</span>
              </h1>

              <p className={styles.heroCopy}>
                Finding your people shouldn't feel impossible. HobbyBuddy connects you with locals who get your energy, love the same things you do, and actually want to show up.
              </p>

              <div className={styles.heroCtas}>
                <Link to="/register" className={styles.heroCtaPrimary}>
                  <span>Join Free</span>
                  <i className="fas fa-arrow-right"></i>
                </Link>
                <a href="#how" className={styles.heroCtaSecondary}>
                  How it works <i className="fas fa-angle-down" style={{ fontSize: '0.75rem' }}></i>
                </a>
              </div>

              <div className={styles.heroSocialProof}>
                <div className={styles.starsRow}>
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className="fas fa-star"></i>
                  ))}
                </div>
                <div className={styles.reviewText}>
                  Real people. Real friendships. No swiping.
                </div>
              </div>
            </div>

            {/* Right — Visual card */}
            <div className={styles.heroCardWrap}>
              <div className={styles.heroCard} style={{
                backgroundImage: 'url(https://d8j0ntlcm91z4.cloudfront.net/user_3F8g8wgqGblsT9ojkykW6TOorbT/hf_20260619_154607_c9e6ad11-20b2-4668-8c09-018e19c37a5a.png)',
              }}>
                <div className={styles.heroCardBadge}>
                  ✨ New Match
                </div>
                <div className={styles.heroCardOverlay}>
                  <div>
                    <h2 className={styles.heroCardNames}>New friends nearby</h2>
                    <div className={styles.heroCardChips}>
                      <span className={styles.heroCardChip}>📷 Photography</span>
                      <span className={styles.heroCardChip}>🏃 Running</span>
                      <span className={styles.heroCardChip}>☕ Coffee</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ VIBE ENGINE ═══════════ */}
        <section
          ref={(el) => (sectionRefs.current[0] = el)}
          data-section="science"
          id="science"
          className={styles.sectionVibe}
          style={{
            opacity: isVisible('science') ? 1 : 0,
            transform: isVisible('science') ? 'translateY(0)' : 'translateY(40px)',
          }}
        >
          <div className={styles.sectionVibeInner}>
            <span className={`${styles.sectionLabel} ${styles.sectionLabelVibe}`}>
              How matching works
            </span>

            <h2 className={styles.sectionTitle}>Made for real connections</h2>

            <p className={styles.sectionSubtitle}>
              We look at what lights you up, how you connect with others, and what makes you — you. Then we introduce you to people who just click.
            </p>

            {/* Row 1 — 3 cards */}
            <div className={styles.traitsRow}>
              {[
                { icon: 'fa-lightbulb', color: '#ff6b35', title: 'Curiosity', desc: 'Adventure seeker or homebody — find someone with the same spark.' },
                { icon: 'fa-fire', color: '#c2410c', title: 'Energy', desc: 'How fired up you get about the things you love.' },
                { icon: 'fa-comments', color: '#c026d3', title: 'Social style', desc: 'Deep one-on-one chats or electric group hangouts — your call.' },
              ].map((trait, i) => (
                <div
                  key={i}
                  className={styles.traitCard}
                  style={{
                    opacity: isVisible('science') ? 1 : 0,
                    transform: isVisible('science') ? 'translateY(0)' : 'translateY(30px)',
                    transition: `all 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.09}s`,
                  }}
                >
                  <div className={styles.traitIcon} style={{ color: trait.color }}>
                    <i className={`fas ${trait.icon}`}></i>
                  </div>
                  <h3>{trait.title}</h3>
                  <p>{trait.desc}</p>
                </div>
              ))}
            </div>

            {/* Row 2 — 2 cards, centered */}
            <div className={styles.traitsRowBottom}>
              {[
                { icon: 'fa-heart', color: '#e11d48', title: 'Warmth', desc: 'The kindness and generosity you bring to every friendship.' },
                { icon: 'fa-wind', color: '#16a34a', title: 'Chill factor', desc: 'Keeping calm and easygoing when life gets busy.' },
              ].map((trait, i) => (
                <div
                  key={i}
                  className={styles.traitCard}
                  style={{
                    opacity: isVisible('science') ? 1 : 0,
                    transform: isVisible('science') ? 'translateY(0)' : 'translateY(30px)',
                    transition: `all 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${(i + 3) * 0.09}s`,
                  }}
                >
                  <div className={styles.traitIcon} style={{ color: trait.color }}>
                    <i className={`fas ${trait.icon}`}></i>
                  </div>
                  <h3>{trait.title}</h3>
                  <p>{trait.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ WHY PEOPLE CHOOSE US ═══════════ */}
        <section
          ref={(el) => (sectionRefs.current[1] = el)}
          data-section="stats"
          className={styles.sectionStats}
          style={{
            opacity: isVisible('stats') ? 1 : 0,
            transform: isVisible('stats') ? 'translateY(0)' : 'translateY(40px)',
          }}
        >
          <div className={styles.statsInner}>
            <span className={`${styles.sectionLabel} ${styles.sectionLabelStats}`}>
              Why people choose us
            </span>

            <h2 className={styles.sectionTitle}>Built for real friendships</h2>

            <p className={styles.sectionSubtitle}>
              No swiping. No games. Just people who actually want to show up.
            </p>

            <div className={styles.statsList}>
              {[
                { icon: 'fa-calendar-check', label: 'Real events & hangouts', desc: 'Show up together, not just scroll', color: '#c2410c' },
                { icon: 'fa-shield-halved', label: 'Profiles you can trust', desc: 'Real people, real interests — no games', color: '#10b981' },
                { icon: 'fa-location-dot', label: 'Right in your neighborhood', desc: 'Meet locals who are just around the corner', color: '#f43f5e' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className={styles.statItem}
                  style={{
                    opacity: isVisible('stats') ? 1 : 0,
                    transform: isVisible('stats') ? 'translateX(0)' : 'translateX(-20px)',
                    transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s`,
                  }}
                >
                  <div className={styles.statIcon} style={{ color: stat.color }}>
                    <i className={`fas ${stat.icon}`}></i>
                  </div>
                  <div className={styles.statText}>
                    <div className={styles.statLabel}>{stat.label}</div>
                    <div className={styles.statDesc}>{stat.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ HOW IT WORKS ═══════════ */}
        <section
          ref={(el) => (sectionRefs.current[2] = el)}
          data-section="how"
          id="how"
          className={styles.sectionHow}
          style={{
            opacity: isVisible('how') ? 1 : 0,
            transform: isVisible('how') ? 'translateY(0)' : 'translateY(40px)',
          }}
        >
          <div className={styles.stepsInner}>
            <h2 className={styles.sectionTitle}>Three steps to your next real friendship</h2>
            <p className={styles.sectionSubtitle}>
              It's quick, free, and actually fun.
            </p>

            <div className={styles.stepsGrid}>
              {[
                { num: '1', title: 'Take the Quiz', desc: 'A quick 20-question personality quiz — takes about 3 minutes and it\'s actually fun. Promise.', icon: 'fa-brain', color: '#c2410c' },
                { num: '2', title: 'Get Matched', desc: 'Our matching finds locals who share your energy and get you.', icon: 'fa-heart', color: '#ec4899' },
                { num: '3', title: 'Show Up & Connect', desc: 'Grab coffee, hit a local event, or just hang out. Real life starts here.', icon: 'fa-calendar-days', color: '#10b981' },
              ].map((step, i) => (
                <div
                  key={i}
                  className={styles.stepCard}
                  style={{
                    opacity: isVisible('how') ? 1 : 0,
                    transform: isVisible('how') ? 'translateY(0)' : 'translateY(30px)',
                    transition: `all 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.14}s`,
                  }}
                >
                  <div className={styles.stepNumber} style={{ background: step.color }}>{step.num}</div>
                  <div className={styles.stepIcon} style={{ color: step.color }}>
                    <i className={`fas ${step.icon}`}></i>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ FINAL CTA ═══════════ */}
        <section
          ref={(el) => (sectionRefs.current[3] = el)}
          data-section="cta"
          className={styles.sectionCta}
          style={{
            opacity: isVisible('cta') ? 1 : 0,
            transform: isVisible('cta') ? 'translateY(0)' : 'translateY(40px)',
          }}
        >
          <div className={styles.ctaBox}>
            <h2 className={styles.ctaTitle}>
              Your next great friendship<br />starts here.
            </h2>
            <p className={styles.ctaCopy}>
              Come find them — they're already looking for you.
            </p>
            <Link to="/register" className={styles.ctaButton}>
              <span>Join Free</span>
              <i className="fas fa-arrow-right"></i>
            </Link>
            <div className={styles.ctaBadges}>
              {[
                { text: 'Free Forever' },
                { text: 'Private & Secure' },
                { text: 'Cancel Anytime' },
              ].map((badge, i) => (
                <span key={i} className={styles.ctaBadge}>
                  {badge.text}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div className={styles.footerBrand}>
              <Link to="/" className={styles.navLogo}>
                <i className="fas fa-users"></i>
                <span>HobbyBuddy</span>
              </Link>
              <p className={styles.footerBrandText}>
                Making it easier for adults to make real friends. No swiping. No games. Just people.
              </p>
            </div>
            <div className={styles.footerLinks}>
              <div className={styles.footerCol}>
                <h4 className={styles.footerColTitle}>Platform</h4>
                <ul>
                  <li><Link to="/login">Sign In</Link></li>
                  <li><Link to="/register">Create Account</Link></li>
                  <li><Link to="/quiz">Personality Quiz</Link></li>
                </ul>
              </div>
              <div className={styles.footerCol}>
                <h4 className={styles.footerColTitle}>Legal</h4>
                <ul>
                  <li><Link to="/privacy">Privacy Policy</Link></li>
                  <li><Link to="/terms">Terms of Service</Link></li>
                  <li><a href="mailto:hello@hobbybuddy.app">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            &copy; {new Date().getFullYear()} HobbyBuddy. All rights reserved.
          </div>
        </footer>
      </main>

      {/* ── Mobile sticky CTA ── */}
      <div className={styles.mobileStickyCta}>
        <Link to="/register" className={styles.mobileStickyCtaButton}>
          Join Free <i className="fas fa-arrow-right"></i>
        </Link>
      </div>
    </>
  );
}
