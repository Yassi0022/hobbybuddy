import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useLocation from '../hooks/useLocation';
import useEvents from '../hooks/useEvents';
import EventCard from '../components/events/EventCard';
import EventFilters from '../components/events/EventFilters';
import CreateEventModal from '../components/events/CreateEventModal';
import EmptyState from '../components/ui/EmptyState';
import Navbar from '../components/ui/Navbar';
import { showToast } from '../utils/toast';

/**
 * Events page — full event browsing and creation surface.
 *
 * Shows:
 * - Location bar (shared with Discover)
 * - Filter bar (source, hobby)
 * - Paginated event grid
 * - Create event button + modal
 * - Fallback states
 */
export default function EventsPage() {
  const { token, authFetch } = useAuth();
  const navigate = useNavigate();
  const { city, geoStatus, setManualCity, requestGeolocation, buildParams } = useLocation();
  const {
    events, pagination, filters, fallback, loading,
    setFilter, goToPage, refetch,
  } = useEvents(city, buildParams);

  const [showCityInput, setShowCityInput] = useState(false);
  const [pendingCity, setPendingCity] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCitySubmit = () => {
    const trimmed = pendingCity.trim();
    if (trimmed) {
      setManualCity(trimmed);
      setShowCityInput(false);
      setPendingCity('');
    }
  };

  const handleFilterChange = useCallback((key, value) => {
    setFilter(key, value);
  }, [setFilter]);

  const handleApplyFilters = useCallback((page) => {
    goToPage(page);
  }, [goToPage]);

  const handleJoinEvent = useCallback(async (eventId) => {
    try {
      const res = await authFetch(`/api/events/${eventId}/join`, { method: 'POST' });
      if (res.ok) {
        showToast('Joined event!', 'success');
        refetch();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Could not join event', 'error');
      }
    } catch {
      showToast('Could not join event', 'error');
    }
  }, [authFetch, refetch]);

  const handleEventCreated = useCallback(() => {
    setShowCreateModal(false);
    refetch();
  }, [refetch]);

  if (!token) {
    navigate('/login');
    return null;
  }

  const totalPages = pagination?.totalPages || 0;

  return (
    <>
      <div className="bg-mesh">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <Navbar />

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '80px 24px 40px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Events</h1>
            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-muted)' }}>
              {city ? `Discover events in ${city}` : 'Discover local events near you'}
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ minWidth: 160 }}>
            <i className="fas fa-plus"></i> Create event
          </button>
        </div>

        {/* ── Location bar ── */}
        <div className="location-bar">
          <div className="location-pill">
            <i className="fas fa-map-marker-alt" style={{ color: 'var(--color-accent-amber)' }}></i>
            {showCityInput ? (
              <form onSubmit={(e) => { e.preventDefault(); handleCitySubmit(); }} style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text" value={pendingCity} onChange={(e) => setPendingCity(e.target.value)}
                  placeholder="Enter your city..." autoFocus
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: 'var(--color-text)', fontSize: '0.9rem', width: 160,
                  }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Set</button>
                <button type="button" onClick={() => setShowCityInput(false)} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Cancel</button>
              </form>
            ) : (
              <span onClick={() => { setShowCityInput(true); setPendingCity(city || ''); }}
                style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                {city || 'Set your city'}
              </span>
            )}
          </div> {/* .location-pill */}
          {geoStatus === 'idle' && !city && (
            <button className="btn-secondary" onClick={requestGeolocation} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              <i className="fas fa-crosshairs"></i> Use my location
            </button>
          )}
        </div>

        {/* ── Filters ── */}
        <EventFilters filters={filters} onChange={handleFilterChange} onApply={handleApplyFilters} />

        {/* ── Fallback ── */}
        {fallback && (
          <EmptyState
            image={fallback.action === 'no_events' ? 'https://d8j0ntlcm91z4.cloudfront.net/user_3F8g8wgqGblsT9ojkykW6TOorbT/hf_20260619_154708_5b9d1342-bd64-412d-8aa7-5032c79e6283.png' : null}
            title={fallback.message}
            body={fallback.action === 'no_events' ? 'Be the first to host something here.' : null}
            action={
              fallback.action === 'create_event' ? { label: 'Create an event', onClick: () => setShowCreateModal(true) }
              : fallback.action === 'set_city' ? { label: 'Set your city', onClick: () => setShowCityInput(true) }
              : null
            }
          />
        )}

        {/* ── Events grid ── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner-border"></div>
          </div>
        ) : events.length > 0 ? (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}>
              {events.map((event) => (
                <EventCard
                  key={event.id || `evt-${event.title}-${event.date || ''}`}
                  event={event}
                  onJoin={handleJoinEvent}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => goToPage(i)}
                    className={pagination.page === i ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '6px 14px', fontSize: '0.8rem', minWidth: 40 }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : !fallback ? (
          <EmptyState
            image="https://d8j0ntlcm91z4.cloudfront.net/user_3F8g8wgqGblsT9ojkykW6TOorbT/hf_20260619_154708_5b9d1342-bd64-412d-8aa7-5032c79e6283.png"
            title="No events found"
            body="Try adjusting your filters, or be the first to create an event."
            action={{ label: 'Create an event', onClick: () => setShowCreateModal(true) }}
          />
        ) : null}
      </div>

      {/* ── Create event modal ── */}
      {showCreateModal && (
        <CreateEventModal
          city={city}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleEventCreated}
        />
      )}
    </>
  );
}
