/**
 * Smart suggestions panel for the Discover page.
 * Shows local stats and contextual tips to make discovery feel alive.
 */
export default function SuggestionsPanel({ suggestions, location }) {
  if (!suggestions) return null;

  const { activeUsersInCity, upcomingEventsInCity, localTip } = suggestions;

  return (
    <div className="suggestions-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: '1.2rem' }}>💡</span>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Local insights</h3>
      </div>

      {(activeUsersInCity > 0 || upcomingEventsInCity > 0) && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
          {activeUsersInCity > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '1.1rem' }}>👥</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{activeUsersInCity} active {activeUsersInCity === 1 ? 'person' : 'people'}</span>
            </div>
          )}
          {upcomingEventsInCity > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '1.1rem' }}>📅</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{upcomingEventsInCity} upcoming {upcomingEventsInCity === 1 ? 'event' : 'events'}</span>
            </div>
          )}
        </div>
      )}

      {localTip && (
        <p style={{
          margin: 0, fontSize: '0.85rem', color: 'var(--color-text-light)',
          lineHeight: 1.5, fontStyle: 'italic',
        }}>
          {localTip}
        </p>
      )}
    </div>
  );
}
