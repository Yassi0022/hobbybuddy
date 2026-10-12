import { useState } from 'react';
import { Link } from 'react-router-dom';

const FAQS = [
  {
    category: 'Getting Started',
    icon: 'fa-user-plus',
    question: 'How do I register and create an account?',
    answer: 'Click "Get Started" on the homepage or head directly to /register. Once registered, complete our 2-minute personality quiz to uncover your social archetype and find friends with matching interests.'
  },
  {
    category: 'Matching & Quiz',
    icon: 'fa-brain',
    question: 'How does the friendship matching algorithm work?',
    answer: 'Our algorithm blends your Big Five personality traits (the "vibe score") with shared hobbies and location. You get matched based on psychological compatibility and conversational resonance, avoiding random awkward encounters.'
  },
  {
    category: 'Community & Events',
    icon: 'fa-calendar-alt',
    question: 'How do I find and join local events?',
    answer: 'Navigate to the Events tab in your dashboard. You can filter upcoming local gatherings by category (sports, arts, gaming, outdoor) and RSVP with one click.'
  },
  {
    category: 'Account & Security',
    icon: 'fa-shield-alt',
    question: 'How do I reset my password?',
    answer: 'Visit the /login page and click "Forgot password". Enter your email to receive a secure password reset link valid for 60 minutes.'
  },
  {
    category: 'Privacy & Safety',
    icon: 'fa-lock',
    question: 'Is my personal data private?',
    answer: 'Absolutely. We do not sell your personal data. We comply with GDPR regulations, and your quiz answers are used exclusively for computing compatibility with other members.'
  },
  {
    category: 'Support',
    icon: 'fa-headset',
    question: 'How do I contact customer support?',
    answer: 'You can reach us anytime at hello@hobbybuddy.com or by filling out our Contact Form. Our team responds within 24 hours.'
  }
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(0);

  const toggleAccordion = (idx) => {
    setOpenIdx(openIdx === idx ? -1 : idx);
  };

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
            fontSize: '0.9rem',
            transition: 'all 0.2s ease'
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
            Help & Knowledge Base
          </span>
          <h1 style={{ 
            fontSize: '2.75rem', 
            fontWeight: 800, 
            color: 'var(--color-ink, #1a1a2e)', 
            letterSpacing: '-0.02em', 
            marginBottom: '1rem' 
          }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted, #64748b)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.6 }}>
            Everything you need to know about HobbyBuddy, the personality quiz, and connecting with local friends.
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {FAQS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div 
                key={idx}
                style={{ 
                  background: '#ffffff', 
                  borderRadius: '16px', 
                  border: isOpen ? '1px solid rgba(194, 65, 12, 0.3)' : '1px solid rgba(0, 0, 0, 0.06)',
                  boxShadow: isOpen ? '0 12px 28px rgba(194, 65, 12, 0.08)' : '0 2px 8px rgba(0, 0, 0, 0.02)',
                  overflow: 'hidden',
                  transition: 'all 0.25s ease'
                }}
              >
                <button
                  onClick={() => toggleAccordion(idx)}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%',
                    padding: '1.4rem 1.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: isOpen ? 'var(--color-primary, #c2410c)' : '#f8fafc',
                      color: isOpen ? '#ffffff' : 'var(--color-primary, #c2410c)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}>
                      <i className={`fas ${item.icon}`}></i>
                    </div>
                    <span style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: 700, 
                      color: isOpen ? 'var(--color-primary, #c2410c)' : 'var(--color-ink, #1a1a2e)' 
                    }}>
                      {item.question}
                    </span>
                  </div>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: isOpen ? 'rgba(194, 65, 12, 0.1)' : '#f1f5f9',
                    color: isOpen ? 'var(--color-primary, #c2410c)' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    flexShrink: 0
                  }}>
                    <i className="fas fa-chevron-down" style={{ fontSize: '0.8rem' }}></i>
                  </div>
                </button>

                {isOpen && (
                  <div style={{ 
                    padding: '0 1.75rem 1.5rem 4.75rem', 
                    fontSize: '0.98rem', 
                    lineHeight: 1.7, 
                    color: 'var(--color-text-muted, #475569)' 
                  }}>
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ 
          marginTop: '4rem', 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, rgba(194, 65, 12, 0.05), rgba(244, 63, 94, 0.05))',
          borderRadius: '20px',
          padding: '2.5rem',
          border: '1px solid rgba(194, 65, 12, 0.12)'
        }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-ink, #1a1a2e)', marginBottom: '0.5rem' }}>
            Still have questions?
          </h3>
          <p style={{ color: 'var(--color-text-muted, #64748b)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Can't find what you're looking for? Reach out to our friendly support team.
          </p>
          <Link
            to="/contact"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 26px',
              background: 'var(--color-primary, #c2410c)',
              color: '#ffffff',
              borderRadius: '999px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              boxShadow: '0 4px 14px rgba(194, 65, 12, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fas fa-envelope"></i> Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
