import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import { showToast } from '../utils/toast';
import { ARCHETYPES } from '../utils/archetype';
import Navbar from '../components/ui/Navbar';
import EmptyState from '../components/ui/EmptyState';

const archetypeEmoji = (name) =>
  ARCHETYPES.find(a => a.name === name)?.emoji || '🧩';

/**
 * MatchesPage — connection lifecycle manager.
 * Route: /matches
 *
 * Fetches GET /api/match-requests (all requests involving the user) and
 * buckets them into Incoming (pending received), Sent (pending sent),
 * and Connected (confirmed). Declined requests are shown as re-connectable.
 */
export default function MatchesPage() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/match-requests`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.matchRequests || []);
      } else {
        setError('load_failed');
      }
    } catch {
      setError('load_failed');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const act = async (id, method, path, successMsg) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/match-requests/${id}${path}`, {
        method,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('hb_token') || ''}` },
      });
      if (res.ok) {
        showToast(successMsg, 'success');
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Action failed', 'error');
      }
    } catch {
      showToast('Action failed', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const incoming = requests.filter(r => r.role === 'candidate' && r.status === 'PENDING');
  const sent = requests.filter(r => r.role === 'requester' && r.status === 'PENDING');
  const connected = requests.filter(r => r.status === 'CONFIRMED' || r.status === 'DONE');
  const declined = requests.filter(r => r.role === 'candidate' && r.status === 'DECLINED');

  const hasAny = incoming.length || sent.length || connected.length || declined.length;

  const MatchCard = ({ r, actions }) => (
    <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16 }}>
      <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--color-accent-warm)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, flexShrink: 0 }}>
        {(r.buddyName || '?')[0]?.toUpperCase() || '?'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{r.buddyName}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
          {r.buddyArchetype ? `${archetypeEmoji(r.buddyArchetype)} ${r.buddyArchetype}` : ''}
          {r.buddyCity ? ` · ${r.buddyCity}` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div>
    </div>
  );

  const btn = (label, icon, kind, onClick, disabled) => (
    <button
      className={kind === 'primary' ? 'btn-primary' : 'btn-secondary'}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{ padding: '8px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
    >
      {icon && <i className={`fas ${icon}`} style={{ marginRight: 6 }}></i>}{label}
    </button>
  );

  return (
    <>
      <div className="bg-mesh">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <Navbar />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 16px 40px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Your matches</h1>
        <p style={{ margin: '0 0 24px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Manage connection requests and start conversations with people you’ve matched with.
        </p>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <div className="spinner-border"></div>
          </div>
        ) : error ? (
          <EmptyState icon="⚠️" title="Couldn’t load matches" body="Please try again in a moment." action={{ label: 'Retry', onClick: load }} />
        ) : !hasAny ? (
          <EmptyState
            icon="💫"
            title="No connections yet"
            body="Browse Discover, send a match request, and when they accept you’ll see them here."
            action={{ label: 'Discover people', href: '/discover' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {incoming.length > 0 && (
              <Section title="📥 Incoming requests" subtitle="People who want to connect with you">
                {incoming.map(r => (
                  <MatchCard key={r.id} r={r} actions={[
                    btn('Accept', 'fa-check', 'primary', () => act(r.id, 'PATCH', '/confirm', 'Match accepted!'), actionLoadingId === r.id),
                    btn('Decline', 'fa-times', 'secondary', () => act(r.id, 'POST', '/decline', 'Request declined'), actionLoadingId === r.id),
                  ]} />
                ))}
              </Section>
            )}

            {connected.length > 0 && (
              <Section title="💬 Connected" subtitle="You can message these people">
                {connected.map(r => (
                  <MatchCard key={r.id} r={r} actions={[
                    btn('Message', 'fa-comment-dots', 'primary', () => navigate(`/messages?with=${r.buddyId}`)),
                  ]} />
                ))}
              </Section>
            )}

            {sent.length > 0 && (
              <Section title="⏳ Sent" subtitle="Awaiting their response">
                {sent.map(r => (
                  <MatchCard key={r.id} r={r} actions={[
                    <span key="pending" style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, padding: '8px 14px' }}>
                      <i className="fas fa-clock" style={{ marginRight: 6 }}></i>Pending
                    </span>,
                  ]} />
                ))}
              </Section>
            )}

            {declined.length > 0 && (
              <Section title=" Archived" subtitle="Requests you declined">
                {declined.map(r => (
                  <MatchCard key={r.id} r={r} actions={[
                    btn('Connect', 'fa-user-plus', 'secondary', () => act(r.buddyId, 'POST', '', 'Match request sent!'), actionLoadingId === r.buddyId),
                  ]} />
                ))}
              </Section>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{title}</h2>
        {subtitle && <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}
