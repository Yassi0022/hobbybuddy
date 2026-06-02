/**
 * Small event teaser card for the Discover page.
 * Shows just enough to tease the Events section.
 */
export default function EventTeaserCard({ event }) {
  const {
    title = '',
    hobbyCategory = '',
    city = '',
    date = null,
    source = 'internal',
    externalUrl = null,
  } = event;

  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  }) : '';

  const handleClick = () => {
    if (source === 'external' && externalUrl) {
      window.open(externalUrl, '_blank', 'noopener');
    }
  };

  return (
    <div
      className="card event-teaser-card"
      onClick={handleClick}
      style={{
        padding: '14px', cursor: source === 'external' ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '0.65rem', padding: '2px 8px', borderRadius: 100,
          background: source === 'external' ? 'rgba(217, 119, 6, 0.08)' : 'rgba(5, 150, 105, 0.08)',
          color: source === 'external' ? 'var(--color-accent-amber)' : 'var(--color-accent-emerald)',
          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          {source === 'external' ? '🎟️ Public' : '📅 Local'}
        </span>
        {formattedDate && (
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{formattedDate}</span>
        )}
      </div>
      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.3 }}>{title}</h4>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {hobbyCategory && (
          <span style={{
            fontSize: '0.7rem', padding: '2px 8px', borderRadius: 6,
            background: '#f5f5f4', color: '#57534e',
          }}>{hobbyCategory}</span>
        )}
        {city && <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>📍 {city}</span>}
      </div>
    </div>
  );
}
