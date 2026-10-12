import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function InviteFriends() {
  const [copied, setCopied] = useState(false);
  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/register?ref=invite` : '/register?ref=invite';

  const [copyError, setCopyError] = useState(false);
  const handleCopy = async () => {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  return (
    <section aria-label="Invite friends" style={{ padding: '2rem 0' }}>
      <h3>Invite friends</h3>
      <p>Share your profile link to connect with people who share your hobbies.</p>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.75rem' }}>
        <input type="text" readOnly value={inviteLink} aria-label="Invite link" style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #ccc' }} />
        <button onClick={handleCopy} aria-label="Copy invite link" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', background: '#c2410c', color: '#fff', cursor: 'pointer' }}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
        {copyError && (
          <span style={{ color: '#dc2626', fontSize: '0.85rem', marginLeft: '0.5rem' }} aria-live="polite">
            Could not copy — please select the link manually.
          </span>
        )}
      </div>
      <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
        <Link to="/register?ref=invite">Register with invite</Link>
      </p>
    </section>
  );
}
