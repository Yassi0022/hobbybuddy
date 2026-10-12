import { Link } from 'react-router-dom';

const HELP_TOPICS = [
  {
    icon: 'fa-rocket',
    title: 'Getting Started',
    color: '#c2410c',
    bg: 'rgba(194, 65, 12, 0.08)',
    desc: 'Create your account, take the quick social vibe quiz, and let our algorithm introduce you to local kindred spirits.'
  },
  {
    icon: 'fa-user-check',
    title: 'Profile & Archetypes',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.08)',
    desc: 'Customize your bio, pick your favorite hobbies, and see your Big Five radar chart evolve.'
  },
  {
    icon: 'fa-calendar-star',
    title: 'Events & Meetups',
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.08)',
    desc: 'Browse or host low-pressure events like board game nights, hiking sessions, or coffee chats.'
  },
  {
    icon: 'fa-comments',
    title: 'Safe Messaging',
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.08)',
    desc: 'Chat directly with mutual matches in real time. We prioritize privacy, mutual opt-in, and safety.'
  }
];

export default function Help() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base, #faf9f6)', padding: '3rem 1.5rem 5rem' }}>
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
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

        <header style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ 
            display: 'inline-block',
            padding: '6px 14px', 
            borderRadius: '999px', 
            background: 'rgba(194, 65, 12, 0.1)', 
            color: 'var(--color-primary, #c2410c)', 
            fontSize: '0.85rem', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            marginBottom: '1rem'
          }}>
            Support Hub
          </span>
          <h1 style={{ 
            fontSize: '2.75rem', 
            fontWeight: 800, 
            color: 'var(--color-ink, #1a1a2e)', 
            letterSpacing: '-0.02em', 
            marginBottom: '1rem' 
          }}>
            How can we help you?
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted, #64748b)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.6 }}>
            Explore guides, learn how HobbyBuddy works, and find the answers you need to make great friendships.
          </p>
        </header>

        {/* Feature Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          {HELP_TOPICS.map((topic, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '2rem 1.75rem',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: topic.bg,
                color: topic.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem'
              }}>
                <i className={`fas ${topic.icon}`}></i>
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-ink, #1a1a2e)', margin: 0 }}>
                {topic.title}
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.6, margin: 0 }}>
                {topic.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Community Guidelines Box */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '2.5rem',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          marginBottom: '3rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(194, 65, 12, 0.1)',
              color: 'var(--color-primary, #c2410c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="fas fa-heart"></i>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-ink, #1a1a2e)', margin: 0 }}>
              Community Values & Safety
            </h2>
          </div>
          <ul style={{ paddingLeft: '1.5rem', color: '#475569', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <li><strong>Kindness First:</strong> Treat everyone with mutual respect, warmth, and open-mindedness.</li>
            <li><strong>Authentic Profiles:</strong> Use your real hobbies and sincere answers to ensure high-compatibility matches.</li>
            <li><strong>Zero Tolerance:</strong> Spam, harassment, discrimination, or hate speech result in immediate account termination.</li>
            <li><strong>Meet Safely:</strong> For your first in-person hangouts, pick public spaces like cozy cafes, parks, or group events.</li>
          </ul>
        </div>

        {/* Footer Navigation CTA */}
        <div style={{
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <Link
            to="/faq"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: '#ffffff',
              color: 'var(--color-ink, #1a1a2e)',
              border: '1px solid #e2e8f0',
              borderRadius: '999px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
            }}
          >
            <i className="fas fa-question-circle"></i> Browse FAQs
          </Link>
          <Link
            to="/contact"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'var(--color-primary, #c2410c)',
              color: '#ffffff',
              borderRadius: '999px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              boxShadow: '0 4px 14px rgba(194, 65, 12, 0.25)'
            }}
          >
            <i className="fas fa-envelope"></i> Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
