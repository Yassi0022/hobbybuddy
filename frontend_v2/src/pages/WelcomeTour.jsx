import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const TOUR_STEPS = [
  {
    icon: 'fa-sparkles',
    badge: 'Step 1 of 3',
    title: 'Welcome to HobbyBuddy!',
    subtitle: 'Friendships based on chemistry, not surface metrics.',
    body: 'HobbyBuddy uses a validated psychological model combined with your favorite activities to connect you with people you actually click with in real life.',
    imageIcon: 'fa-user-friends'
  },
  {
    icon: 'fa-compass',
    badge: 'Step 2 of 3',
    title: 'Explore & Connect',
    subtitle: 'Browse compatible matches in your local area.',
    body: 'Head to the Discover tab to explore people with shared hobbies and high compatibility scores. Send a connection request with a single tap.',
    imageIcon: 'fa-heart'
  },
  {
    icon: 'fa-calendar-check',
    badge: 'Step 3 of 3',
    title: 'Join or Host Events',
    subtitle: 'Low-pressure hangouts made simple.',
    body: 'Take connections into the real world. RSVP to coffee meetups, bouldering sessions, book clubs, or game nights organized by members of your community.',
    imageIcon: 'fa-map-marker-alt'
  }
];

export default function WelcomeTour() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base, #faf9f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <div style={{
        maxWidth: '560px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '3rem 2.5rem',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 12px 40px rgba(194, 65, 12, 0.08)',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Step Indicator dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '2rem' }}>
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? '28px' : '8px',
                height: '8px',
                borderRadius: '999px',
                background: i === step ? 'var(--color-primary, #c2410c)' : '#e2e8f0',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
          ))}
        </div>

        {/* Hero Icon */}
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '22px',
          background: 'linear-gradient(135deg, rgba(194, 65, 12, 0.1), rgba(244, 63, 94, 0.1))',
          color: 'var(--color-primary, #c2410c)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          margin: '0 auto 1.5rem'
        }}>
          <i className={`fas ${current.imageIcon}`}></i>
        </div>

        <span style={{
          display: 'inline-block',
          padding: '4px 14px',
          borderRadius: '999px',
          background: 'rgba(194, 65, 12, 0.08)',
          color: 'var(--color-primary, #c2410c)',
          fontSize: '0.8rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.75rem'
        }}>
          {current.badge}
        </span>

        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--color-ink, #1a1a2e)', marginBottom: '0.5rem' }}>
          {current.title}
        </h1>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#c2410c', marginBottom: '1.25rem' }}>
          {current.subtitle}
        </div>
        <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '0.98rem', lineHeight: 1.65, marginBottom: '2.5rem' }}>
          {current.body}
        </p>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: step === 0 ? '#cbd5e1' : '#334155',
              fontWeight: 600,
              fontSize: '0.92rem',
              cursor: step === 0 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fas fa-arrow-left"></i> Previous
          </button>

          {isLast ? (
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '12px 28px',
                borderRadius: '12px',
                border: 'none',
                background: 'var(--color-primary, #c2410c)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(194, 65, 12, 0.25)'
              }}
            >
              Get Started <i className="fas fa-check"></i>
            </button>
          ) : (
            <button
              onClick={() => setStep(s => Math.min(TOUR_STEPS.length - 1, s + 1))}
              style={{
                padding: '12px 26px',
                borderRadius: '12px',
                border: 'none',
                background: 'var(--color-primary, #c2410c)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(194, 65, 12, 0.25)'
              }}
            >
              Next <i className="fas fa-arrow-right"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
