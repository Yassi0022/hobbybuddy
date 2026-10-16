import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import { showToast } from '../utils/toast';
import { ARCHETYPES } from '../utils/archetype';
import Navbar from '../components/ui/Navbar';
import EmptyState from '../components/ui/EmptyState';
import { getDemoPublicProfile } from '../utils/demoData';

const archetypeEmoji = (name) =>
  ARCHETYPES.find(a => a.name === name)?.emoji || '🧩';

const parsePhotos = (json) => {
  try {
    const arr = JSON.parse(json || '[]');
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  } catch {
    return [];
  }
};

/**
 * ProfileView — public (sanitized) profile of another user.
 * Route: /profile/:id
 *
 * Fetches GET /api/users/{id}/public, which also returns the viewer-relative
 * connectionStatus so we can render the correct CTA:
 *   none            -> Connect
 *   pending_sent    -> "Request sent" (disabled)
 *   pending_received-> Accept / Decline
 *   confirmed       -> Message
 */
export default function ProfileView() {
  const { id } = useParams();
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isSelf, setIsSelf] = useState(false);

  const myId = localStorage.getItem('userId');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/users/${id}/public`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setIsSelf(String(data.id) === String(myId));
      } else {
        const fallback = getDemoPublicProfile(id);
        setProfile(fallback);
        setIsSelf(String(fallback.id) === String(myId));
      }
    } catch {
      const fallback = getDemoPublicProfile(id);
      setProfile(fallback);
      setIsSelf(String(fallback.id) === String(myId));
    } finally {
      setLoading(false);
    }
  }, [authFetch, id, myId]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const handleConnect = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/match-requests/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hb_token') || ''}`,
        },
      });
      if (res.ok) {
        showToast('Match request sent!', 'success');
        load();
      } else if (res.status === 409) {
        showToast('You already sent a request to this person.', 'error');
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to send request', 'error');
      }
    } catch {
      showToast('Failed to send request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/match-requests/${profile.matchRequestId}/confirm`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('hb_token') || ''}` },
      });
      if (res.ok) {
        showToast('Match accepted! You can now message them.', 'success');
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Could not accept request', 'error');
      }
    } catch {
      showToast('Could not accept request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/match-requests/${profile.matchRequestId}/decline`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('hb_token') || ''}` },
      });
      if (res.ok) {
        showToast('Request declined', 'success');
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Could not decline request', 'error');
      }
    } catch {
      showToast('Could not decline request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessage = () => navigate(`/messages?with=${id}`);

  const photos = profile ? parsePhotos(profile.photosJson) : [];
  const firstPhoto = photos[0];
  const initial = profile?.name?.[0]?.toUpperCase() || '?';
  const hobbyList = profile?.hobbies
    ? profile.hobbies.split(',').map(h => h.trim()).filter(Boolean)
    : [];
  const prompts = [
    { q: 'A perfect weekend is…', a: profile?.prompt1 },
    { q: 'I’m secretly good at…', a: profile?.prompt2 },
    { q: 'My happy place is…', a: profile?.prompt3 },
  ].filter(p => p.a && p.a.trim());

  return (
    <>
      <div className="bg-mesh">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <Navbar />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '80px 16px 40px' }}>
        <Link to="/discover" className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem', marginBottom: 16, display: 'inline-flex' }}>
          <i className="fas fa-arrow-left" style={{ marginRight: 6 }}></i> Back to Discover
        </Link>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <div className="spinner-border"></div>
          </div>
        ) : error === 'not_found' ? (
          <EmptyState icon="🔍" title="Profile not found" body="This person may no longer be available." />
        ) : error ? (
          <EmptyState icon="⚠️" title="Couldn’t load profile" body="Please try again in a moment." />
        ) : (
          <div className="card" style={{ padding: 24, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              {firstPhoto ? (
                <img src={firstPhoto} alt={profile.name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)' }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-accent-warm)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800 }}>
                  {initial}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{profile.name}</h1>
                {profile.archetype && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {archetypeEmoji(profile.archetype)} {profile.archetype}
                  </div>
                )}
                {profile.city && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    <i className="fas fa-map-marker-alt" style={{ marginRight: 4 }}></i>
                    {profile.city}{profile.age ? ` · ${profile.age}` : ''}
                  </div>
                )}
              </div>
            </div>

            {profile.personalityTagline && (
              <p style={{ fontStyle: 'italic', color: 'var(--color-text)', margin: '8px 0 16px', fontSize: '0.95rem' }}>
                “{profile.personalityTagline}”
              </p>
            )}

            {hobbyList.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {hobbyList.map((h, i) => (
                  <span key={i} className="people-card-hobby-chip">{h}</span>
                ))}
              </div>
            )}

            {prompts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '8px 0 20px' }}>
                {prompts.map((p, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.q}</div>
                    <div style={{ fontSize: '0.92rem', color: 'var(--color-text)', marginTop: 2 }}>{p.a}</div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA area */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
              {isSelf ? (
                <Link to="/profile" className="btn-primary" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
                  <i className="fas fa-user-edit" style={{ marginRight: 6 }}></i> Edit your profile
                </Link>
              ) : profile.connectionStatus === 'confirmed' ? (
                <button className="btn-primary" onClick={handleMessage} style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
                  <i className="fas fa-comment-dots" style={{ marginRight: 6 }}></i> Message
                </button>
              ) : profile.connectionStatus === 'pending_sent' ? (
                <button className="btn-secondary" disabled style={{ padding: '10px 18px', fontSize: '0.85rem', opacity: 0.7 }}>
                  <i className="fas fa-clock" style={{ marginRight: 6 }}></i> Request sent — awaiting response
                </button>
              ) : profile.connectionStatus === 'pending_received' ? (
                <>
                  <button className="btn-primary" onClick={handleAccept} disabled={actionLoading} style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
                    <i className="fas fa-check" style={{ marginRight: 6 }}></i> Accept
                  </button>
                  <button className="btn-secondary" onClick={handleDecline} disabled={actionLoading} style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
                    <i className="fas fa-times" style={{ marginRight: 6 }}></i> Decline
                  </button>
                </>
              ) : (
                <button className="btn-primary" onClick={handleConnect} disabled={actionLoading} style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
                  <i className="fas fa-user-plus" style={{ marginRight: 6 }}></i> Connect
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
