/**
 * Curated fallback/empty state for the Discover page.
 * Shown when no people are found or no location is set.
 */
export default function FallbackState({ fallback, onSetCity, onExploreAll }) {
  if (!fallback) return null;

  const { type, message, action, actionLabel, image } = fallback;

  const icon = type === 'no_location' ? '📍'
    : type === 'sparse_area' ? '🌱'
    : type === 'first_in_area' ? '🚀'
    : '🔍';

  return (
    <div className="curated-fallback-card">
      {image ? (
        <div style={{ marginBottom: 16 }}>
          <img src={image} alt="" style={{ maxWidth: 240, width: '100%', height: 'auto', borderRadius: 12 }} />
        </div>
      ) : (
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>{icon}</div>
      )}
      <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 700 }}>{message}</h3>
      {action && (
        <div style={{ marginTop: 16 }}>
          {(action === 'set_city' || action === 'expand_radius' || action === 'explore_all') && (
            <button
              className="btn-primary"
              onClick={action === 'set_city' ? onSetCity : onExploreAll}
              style={{ minWidth: 180 }}
            >
              {actionLabel || 'Explore'}
            </button>
          )}
          {action === 'invite_friends' && (
            <button className="btn-primary" onClick={() => {
              navigator.clipboard?.writeText(window.location.origin);
            }} style={{ minWidth: 180 }}>
              📋 Copy invite link
            </button>
          )}
        </div>
      )}
    </div>
  );
}
