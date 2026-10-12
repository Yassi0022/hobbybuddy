import { useState } from 'react';
import { Link } from 'react-router-dom';
import { showToast } from '../utils/toast';

export default function InviteFriends() {
  const [copied, setCopied] = useState(false);
  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/register?ref=invite` : '/register?ref=invite';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      showToast('Invite link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Unable to copy automatically. Please copy the link manually.', 'error');
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Hey! I'm using HobbyBuddy to find local friends based on hobbies and personality compatibility. Join me here: ${inviteLink}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const shareTelegram = () => {
    const text = encodeURIComponent(`Find your vibe and meetup with local hobby buddies!`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${text}`, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base, #faf9f6)', padding: '3rem 1.5rem 5rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <Link 
          to="/dashboard" 
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
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </Link>

        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '3rem 2rem',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 8px 32px rgba(194, 65, 12, 0.06)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #c2410c, #f43f5e)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            margin: '0 auto 1.5rem',
            boxShadow: '0 8px 24px rgba(194, 65, 12, 0.25)'
          }}>
            <i className="fas fa-gift"></i>
          </div>

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
            Grow the community
          </span>

          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-ink, #1a1a2e)', marginBottom: '0.75rem' }}>
            Invite Your Friends
          </h1>
          <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '440px', margin: '0 auto 2rem' }}>
            Great friendships are meant to be shared. Send your unique referral link to friends or local groups so they can take the personality quiz and connect.
          </p>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '8px 8px 8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '1.75rem'
          }}>
            <input
              type="text"
              readOnly
              value={inviteLink}
              aria-label="Invite link"
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontSize: '0.92rem',
                color: '#334155',
                fontFamily: 'inherit',
                outline: 'none'
              }}
            />
            <button
              onClick={handleCopy}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                background: copied ? '#059669' : 'var(--color-primary, #c2410c)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            Or share directly via
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={shareWhatsApp}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                background: '#25D366',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fab fa-whatsapp"></i> WhatsApp
            </button>
            <button
              onClick={shareTelegram}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                background: '#229ED9',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fab fa-telegram"></i> Telegram
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
