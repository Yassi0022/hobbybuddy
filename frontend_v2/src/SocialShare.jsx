/* Browser-only native share / clipboard / visible link for public profile */
import { useState } from 'react';

export default function SocialShare({ url = '' }) {
  const [status, setStatus] = useState('');

  const safeUrl = (typeof url === 'string' && url.trim() !== '')
    ? url.trim()
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/profile`;

  const handleShare = async () => {
    setStatus('');
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: 'View my public profile on HobbyBuddy',
          text: 'Check out my public profile on HobbyBuddy:',
          url: safeUrl,
        });
        // User completed share — neutral, no extra message needed
      } else {
        throw new Error('share_not_available');
      }
    } catch (err) {
      if (err && err.name === 'AbortError') {
        // User cancelled — neutral, no error message
        return;
      }
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(safeUrl);
          setStatus('copied');
        } else {
          setStatus('visible');
        }
      } catch {
        setStatus('visible');
      }
    }
  };

  return (
    <div className="social-share" aria-label="Share your public profile">
      <button
        type="button"
        onClick={handleShare}
        aria-label="Share public profile link"
        style={{
          padding: '10px 18px',
          borderRadius: '999px',
          border: '1px solid #c2410c',
          background: '#fff',
          color: '#c2410c',
          fontWeight: 600,
          fontSize: '0.85rem',
          cursor: 'pointer',
          minHeight: '44px',
          minWidth: '44px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <i className="fas fa-share-alt" aria-hidden="true" /> Share profile
      </button>
      {status === 'copied' && (
        <p role="status" aria-live="polite" style={{ marginTop: 8, fontSize: '0.85rem', color: '#15803d' }}>
          Profile link copied to clipboard.
        </p>
      )}
      {status === 'visible' && (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: '0.85rem', color: '#5a3e2b', marginBottom: 4 }}>
            Copy your public profile link:
          </p>
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open public profile"
            style={{ wordBreak: 'break-all', fontSize: '0.85rem', color: '#c2410c', fontWeight: 600 }}
          >
            {safeUrl}
          </a>
        </div>
      )}
    </div>
  );
}
