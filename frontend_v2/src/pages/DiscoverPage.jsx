import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useLocation from '../hooks/useLocation';
import useDiscover from '../hooks/useDiscover';
import PeopleCard from '../components/discover/PeopleCard';
import EventTeaserCard from '../components/discover/EventTeaserCard';
import SuggestionsPanel from '../components/discover/SuggestionsPanel';
import FallbackState from '../components/discover/FallbackState';

/**
 * Discover page — social discovery surface.
 *
 * Shows:
 * - Location bar (city selector + geolocation)
 * - Smart suggestions panel
 * - Nearby compatible people (ranked cards)
 * - Event teasers (link to full Events page)
 * - Fallback states when area is sparse
 */
export default function DiscoverPage() {
  const { token } = useAuth();
  const {
    city, geoStatus, setManualCity, requestGeolocation, buildParams, hasLocation,
  } = useLocation();
  const {
    people, eventTeasers, suggestions, location, fallback, loading, refetch,
  } = useDiscover(city, buildParams);

  const [showCityInput, setShowCityInput] = useState(false);
  const [pendingCity, setPendingCity] = useState('');

  const handleCitySubmit = () => {
    const trimmed = pendingCity.trim();
    if (trimmed) {
      setManualCity(trimmed);
      setShowCityInput(false);
      setPendingCity('');
    }
  };

  const handleSetCity = useCallback(() => {
    setShowCityInput(true);
    setPendingCity(city || '');
  }, [city]);

  const handleExploreAll = useCallback(() => {
    setManualCity('');
    refetch();
  }, [setManualCity, refetch]);

  if (!token) {
    window.location.href = '/login';
    return null;
  }

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
            <li><Link to="/discover" className="active">Discover</Link></li>
            <li><Link to="/events">Events</Link></li>
            <li><Link to="/profile">Profile</Link></li>
          </ul>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '80px 24px 40px' }}>

        {/* ── Location bar ── */}
        <div className="location-bar">
          <div className="location-pill">
            <i className="fas fa-map-marker-alt" style={{ color: 'var(--color-accent-warm)' }}></i>
            {showCityInput ? (
              <form onSubmit={(e) => { e.preventDefault(); handleCitySubmit(); }} style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={pendingCity}
                  onChange={(e) => setPendingCity(e.target.value)}
                  placeholder="Enter your city..."
                  autoFocus
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: 'var(--color-text)', fontSize: '0.9rem', width: 160,
                  }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Set</button>
                <button type="button" onClick={() => setShowCityInput(false)} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Cancel</button>
              </form>
            ) : (
              <span
                onClick={handleSetCity}
                style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
              >
                {city || 'Set your city'}
              </span>
            )}
          </div> {/* .location-pill */}

          {geoStatus === 'idle' && !city && (
            <button className="btn-secondary" onClick={requestGeolocation} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              <i className="fas fa-crosshairs"></i> Use my location
            </button>
          )}

          {geoStatus === 'requesting' && (
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <i className="fas fa-spinner fa-spin"></i> Detecting...
            </span>
          )}

          {hasLocation && (
            <button className="btn-secondary" onClick={handleExploreAll} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              <i className="fas fa-globe"></i> Explore all
            </button>
          )}
        </div> {/* .location-bar */}

        {/* ── Suggestions ── */}
        <SuggestionsPanel suggestions={suggestions} location={location} />

        {/* ── Fallback state ── */}
        {fallback && (
          <FallbackState
            fallback={fallback}
            onSetCity={handleSetCity}
            onExploreAll={handleExploreAll}
          />
        )}

        {/* ── People section ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {city ? `People in ${city}` : 'People near you'}
            </h2>
            {!loading && people.length > 0 && (
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {people.length} {people.length === 1 ? 'match' : 'matches'}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="spinner-border"></div>
            </div>
          ) : people.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 14,
            }}>
              {people.map((person) => (
                <PeopleCard key={person.id} person={person} />
              ))}
            </div>
          ) : !fallback ? (
            <FallbackState
              fallback={{ type: 'sparse_area', message: `No compatible people found${city ? ` in ${city}` : ''} yet.`, action: 'explore_all', actionLabel: 'Explore all users' }}
              onSetCity={handleSetCity}
              onExploreAll={handleExploreAll}
            />
          ) : null}
        </div>

        {/* ── Event teasers ── */}
        {eventTeasers && eventTeasers.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                🎟️ Events near {city || 'you'}
              </h2>
              <Link to="/events" className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                View all events →
              </Link>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}>
              {eventTeasers.map((event, i) => (
                <EventTeaserCard key={event.id || `teaser-${i}`} event={event} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
