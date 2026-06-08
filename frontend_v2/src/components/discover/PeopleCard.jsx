/**
 * Person card — editorial, restrained, no dating-app feel.
 * No large photo, no match percentage. Tagline-forward, warm initials avatar.
 */
export default function PeopleCard({ person, onConnect }) {
  const {
    id,
    name = 'Buddy',
    archetype = '',
    hobbies = '',
    city = '',
    personalityTagline = '',
  } = person;

  const initial = name?.[0]?.toUpperCase() || '?';
  const hobbyList = hobbies ? hobbies.split(',').map(h => h.trim()).filter(Boolean) : [];

  return (
    <div className="people-card">
      {/* ── Header: avatar + identity ── */}
      <div className="people-card-header">
        <div className="people-card-avatar">{initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="people-card-name">{name}</h3>
          <div className="people-card-meta-row">
            {archetype && (
              <span className="people-card-archetype">{archetype}</span>
            )}
            {city && (
              <span className="people-card-location">
                <i className="fas fa-map-marker-alt" style={{ fontSize: '0.65rem' }}></i>
                {city}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tagline */}
      {personalityTagline && (
        <p className="people-card-tagline">"{personalityTagline}"</p>
      )}

      {/* Hobbies */}
      {hobbyList.length > 0 && (
        <div className="people-card-hobbies">
          {hobbyList.slice(0, 3).map((h, i) => (
            <span key={i} className="people-card-hobby-chip">{h}</span>
          ))}
          {hobbyList.length > 3 && (
            <span className="people-card-hobby-chip">+{hobbyList.length - 3} more</span>
          )}
        </div>
      )}

      {/* Connect button */}
      {onConnect && (
        <button
          className="btn-primary"
          onClick={() => onConnect(id)}
          style={{
            width: '100%', marginTop: 4, padding: '10px 16px',
            fontSize: '0.82rem', fontWeight: 700,
          }}
        >
          <i className="fas fa-user-plus" style={{ marginRight: 6 }}></i>
          Connect
        </button>
      )}
    </div>
  );
}
