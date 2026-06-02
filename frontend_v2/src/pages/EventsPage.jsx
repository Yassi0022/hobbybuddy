import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useLocation from '../hooks/useLocation';
import useEvents from '../hooks/useEvents';
import EventCard from '../components/events/EventCard';
import EventFilters from '../components/events/EventFilters';
import CreateEventModal from '../components/events/CreateEventModal';
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
    window.location.href = '/login';
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

      <nav className="navbar navbar-solid">
        <div className="nav-container">
          <Link to="/dashboard" className="logo">
            <i className="fas fa-users"></i><span>HobbyBuddy</span>
          </Link>
          <ul className="nav-menu">
            <li><Link to="/dashboard">Feed</Link></li>
            <li><Link to="/discover">Discover</Link></li>
            <li><Link to="/events" className="active">Events</Link></li>
            <li><Link to="/profile">Profile</Link></li>
          </ul>
        </div>
      </nav>

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
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: 'var(--color-surface)', borderRadius: 16,
            border: '1px solid var(--color-border)',
            marginBottom: 24,
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📅</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 700 }}>{fallback.message}</h3>
            {fallback.action === 'create_event' && (
              <button className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ marginTop: 16, minWidth: 180 }}>
                Create an event
              </button>
            )}
            {fallback.action === 'set_city' && (
              <button className="btn-primary" onClick={() => setShowCityInput(true)} style={{ marginTop: 16, minWidth: 180 }}>
                Set your city
              </button>
            )}
          </div>
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
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 700 }}>No events found</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Try adjusting filters or create the first event!
            </p>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              Create an event
            </button>
          </div>
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
