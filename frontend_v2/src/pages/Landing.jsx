import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function Landing() {
  const navbarRef = useRef(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Track referral from URL
    const ref = searchParams.get('ref');
    if (ref) {
      sessionStorage.setItem('hobbybuddy_ref', ref);
    }

    const handleScroll = () => {
      if (navbarRef.current) {
        navbarRef.current.classList.toggle('scrolled', window.scrollY > 80);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [searchParams]);

  return (
    <>
      <nav className="navbar" ref={navbarRef}>
        <Link to="/" className="logo"><i className="fas fa-users"></i><span>HobbyBuddy</span></Link>
        <div className="nav-links">
          <Link to="/login" className="btn-pill btn-filled" style={{ padding: '12px 24px', fontSize: '0.9rem' }}>Sign In</Link>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="hero-text-cont">
              <span className="hero-tag" style={{ background: 'rgba(255, 107, 53, 0.1)', color: '#ff6b35', fontWeight: 800, padding: '10px 20px', borderRadius: '100px', fontSize: '0.95rem', marginBottom: '24px', display: 'inline-block', letterSpacing: '0.02em' }}>
                <span className="pulse-dot"></span> Over 10,000 buddies connected
              </span>
              <h1 className="hero-title">Find your <span className="animated-gradient-text">Perfect Buddy</span>.</h1>
              <p className="hero-subtitle">Stop swiping on faces, start connecting over passions. We use smart algorithms behind the scenes to find locals who actually vibe with your energy.</p>
              <div className="hero-actions">
                <Link to="/register" className="btn-pill btn-filled">Start Free Now</Link>
                <a href="#science" className="btn-pill btn-ghost">How It Works</a>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="vibe-card-3d" style={{ backgroundImage: "url('/images/hero-buddy.png')" }}>
              <div className="vibe-badge">Perfect Vibe ⚡</div>
              <div className="card-overlay-content">
                <div className="card-bottom">
                  <h2 style={{ color: 'white', fontSize: '3.2rem', marginBottom: '20px', fontWeight: 800, textShadow: '0 10px 20px rgba(0,0,0,0.4)' }}>Sofia & Alex</h2>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span className="glass-badge">#Reading</span>
                    <span className="glass-badge">#Running</span>
                    <span className="glass-badge">#Photography</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="science" id="science">
          <span className="section-tag" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', fontWeight: 800, padding: '10px 20px', borderRadius: '100px', fontSize: '0.95rem', marginBottom: '24px', display: 'inline-block' }}>The matching logic</span>
          <h2 className="section-title">The Vibe Engine</h2>
          <p style={{ fontSize: '1.3rem', color: 'var(--color-text-body)', maxWidth: '800px', marginBottom: '60px', lineHeight: 1.6 }}>We match you based on who you actually are, not just what you look like. Our smart engine connects you through the traits that define your personality.</p>
          <div className="glass-grid">
            {[
              { icon: 'fa-lightbulb', gradient: 'linear-gradient(135deg, #fff1eb 0%, #ff8c66 100%)', color: '#ff6b35', title: 'Curiosity', desc: "Whether you're always seeking new adventures or prefer the comfort of the familiar." },
              { icon: 'fa-tasks', gradient: 'linear-gradient(135deg, #e0e7ff 0%, #818cf8 100%)', color: '#6366f1', title: 'Drive', desc: 'How you organize your life and stay committed to your goals and hobbies.' },
              { icon: 'fa-comments', gradient: 'linear-gradient(135deg, #fae8ff 0%, #d946ef 100%)', color: '#c026d3', title: 'Social Energy', desc: 'Your preference for deep one-on-one chats or the high energy of large groups.' },
              { icon: 'fa-handshake', gradient: 'linear-gradient(135deg, #ecfeff 0%, #22d3ee 100%)', color: '#0891b2', title: 'Kindness', desc: 'Your natural tendency to be cooperative, empathetic, and supportive of others.' },
              { icon: 'fa-leaf', gradient: 'linear-gradient(135deg, #f0fdf4 0%, #4ade80 100%)', color: '#16a34a', title: 'Balance', desc: 'The ability to stay cool and collected when things get intense or exciting.' },
            ].map((trait, i) => (
              <div className="glass-card" key={i}>
                <div className="trait-icon" style={{ background: trait.gradient, color: trait.color }}><i className={`fas ${trait.icon}`}></i></div>
                <h3>{trait.title}</h3>
                <p>{trait.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="social-proof" style={{ padding: '80px 24px', textAlign: 'center' }}>
          <span className="section-tag" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 800, padding: '10px 20px', borderRadius: '100px', fontSize: '0.95rem', marginBottom: '24px', display: 'inline-block' }}>Join the movement</span>
          <h2 className="section-title">Loved by thousands</h2>
          <div className="stats-grid" style={{ maxWidth: '800px', margin: '40px auto 0' }}>
            <div className="stat-card">
              <div className="stat-number purple">10K+</div>
              <div className="stat-label">Active Buddies</div>
            </div>
            <div className="stat-card">
              <div className="stat-number green">95%</div>
              <div className="stat-label">Match Satisfaction</div>
            </div>
            <div className="stat-card">
              <div className="stat-number cyan">50+</div>
              <div className="stat-label">Hobbies Supported</div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="how-it-works" style={{ padding: '80px 24px', textAlign: 'center' }}>
          <h2 className="section-title">How It Works</h2>
          <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto 60px' }}>Three simple steps to find your perfect hobby buddy</p>
          <div className="steps-grid" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="step-card">
              <div className="step-number-circle">1</div>
              <h3>Take the Quiz</h3>
              <p>Complete our 50-question Big-Five personality assessment in just 4 minutes.</p>
            </div>
            <div className="step-card">
              <div className="step-number-circle">2</div>
              <h3>Get Matched</h3>
              <p>Our AI finds locals with compatible personalities and shared hobbies.</p>
            </div>
            <div className="step-card">
              <div className="step-number-circle">3</div>
              <h3>Start Vibing</h3>
              <p>Chat, join events, and build real friendships over shared passions.</p>
            </div>
          </div>
        </section>

        <section className="final-cta" style={{ textAlign: 'center', background: '#fff1eb', borderRadius: '40px', margin: '0 5% 100px', padding: '120px 40px' }}>
          <h2 style={{ fontSize: '4rem', marginBottom: '24px', fontWeight: 900 }}>Stop searching, start vibing.</h2>
          <p style={{ marginBottom: '48px', fontSize: '1.4rem', color: 'var(--color-text-body)', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>Join thousands of locals discovering authentic connections through the activities they love. Your new best friend is waiting.</p>
          <Link to="/register" className="btn-pill btn-filled">Create Your Profile — It's Free</Link>
          <div className="cta-badges" style={{ marginTop: '30px' }}>
            <span className="cta-badge"><i className="fas fa-check"></i> 100% Free</span>
            <span className="cta-badge"><i className="fas fa-check"></i> No Credit Card</span>
            <span className="cta-badge"><i className="fas fa-check"></i> GDPR Compliant</span>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-content">
          <div className="footer-brand">
            <Link to="/" className="logo"><i className="fas fa-users"></i><span>HobbyBuddy</span></Link>
            <p>Connecting people through shared passions and real energy. No swiping, just authentic local connections.</p>
          </div>
          <div className="footer-links-group">
            <div className="footer-column">
              <h4>Platform</h4>
              <ul>
                <li><Link to="/login">Sign In</Link></li>
                <li><Link to="/register">Register</Link></li>
                <li><Link to="/quiz">Personality Quiz</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <ul>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
                <li><a href="mailto:contact@hobbybuddy.app">Contact Support</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; 2026 HobbyBuddy. Personality matching based on the IPIP Big-Five model.
        </div>
      </footer>
    </>
  );
}
