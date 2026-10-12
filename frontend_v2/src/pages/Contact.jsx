import { useState } from 'react';
import { Link } from 'react-router-dom';
import { showToast } from '../utils/toast';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'General Question', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      showToast('Message sent! We will get back to you shortly.', 'success');
    }, 700);
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
            Get In Touch
          </span>
          <h1 style={{ 
            fontSize: '2.75rem', 
            fontWeight: 800, 
            color: 'var(--color-ink, #1a1a2e)', 
            letterSpacing: '-0.02em', 
            marginBottom: '1rem' 
          }}>
            We'd love to hear from you
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted, #64748b)', maxWidth: '540px', margin: '0 auto', lineHeight: 1.6 }}>
            Have a question, feedback, or a suggestion to improve HobbyBuddy? Send us a message and we'll reply within 24 hours.
          </p>
        </header>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          alignItems: 'start'
        }}>
          {/* Contact Details Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '2.5rem',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
          }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-ink, #1a1a2e)', marginBottom: '1.5rem' }}>
              Direct Channels
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(194, 65, 12, 0.1)',
                  color: 'var(--color-primary, #c2410c)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0
                }}>
                  <i className="fas fa-envelope"></i>
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Email Us</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-ink, #1a1a2e)' }}>hello@hobbybuddy.com</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(5, 150, 105, 0.1)',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0
                }}>
                  <i className="fas fa-bolt"></i>
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Response Time</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-ink, #1a1a2e)' }}>Under 24 hours (Mon - Sun)</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(217, 119, 6, 0.1)',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0
                }}>
                  <i className="fas fa-heart"></i>
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Community</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-ink, #1a1a2e)' }}>Privacy-first & Friendly</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
                Looking for answers right away? Check our <Link to="/faq" style={{ color: 'var(--color-primary, #c2410c)', fontWeight: 600 }}>FAQ guide</Link> or our <Link to="/help" style={{ color: 'var(--color-primary, #c2410c)', fontWeight: 600 }}>Help section</Link>.
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '2.5rem',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
          }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  margin: '0 auto 1.5rem'
                }}>
                  <i className="fas fa-check"></i>
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-ink, #1a1a2e)', marginBottom: '0.5rem' }}>
                  Thank you!
                </h3>
                <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
                  Your message has been sent successfully. We'll be in touch with you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', subject: 'General Question', message: '' }); }}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '999px',
                    background: 'var(--color-primary, #c2410c)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label htmlFor="name" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Alex Rossi"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      transition: 'border 0.2s ease'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="email" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      transition: 'border 0.2s ease'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="subject" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Subject</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                  >
                    <option value="General Question">General Question</option>
                    <option value="Bug Report">Feedback / Bug Report</option>
                    <option value="Quiz & Matching">Quiz & Matching</option>
                    <option value="Privacy & Account">Privacy & Account</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="4"
                    required
                    placeholder="Tell us what's on your mind..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '12px',
                    background: 'var(--color-primary, #c2410c)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: submitting ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 14px rgba(194, 65, 12, 0.25)',
                    transition: 'all 0.2s ease',
                    marginTop: '0.5rem'
                  }}
                >
                  {submitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Sending message...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i> Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
