import { showToast } from '../../utils/toast';

/**
 * Premium event card — editorial hierarchy, restrained colors.
 * No generic SaaS look. Warm terracotta + slate, not indigo.
 */
export default function EventCard({ event, onJoin }) {
  const {
    id, title = '', description = '', hobbyCategory = '',
    location = '', city = '', date = null,
    maxParticipants = 50, currentParticipants = 0,
    joined = false, source = 'internal', externalUrl = null, createdBy = null,
  } = event;

  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null;

  const spotsLeft = maxParticipants - currentParticipants;
  const isFull = spotsLeft <= 0;
  const fillPct = Math.min(100, (currentParticipants / maxParticipants) * 100);

  const handleAction = async () => {
    if (source === 'external') {
      if (externalUrl) window.open(externalUrl, '_blank', 'noopener');
      else showToast('Event link not available', 'error');
      return;
    }
    if (joined) { showToast('You have already joined this event', 'info'); return; }
    if (isFull)  { showToast('This event is full', 'error'); return; }
    if (onJoin) await onJoin(id);
  };

  return (
    <div className="event-card">
      {/* ── Header: source badge + date ── */}
      <div className="event-card-header">
        <div className="event-card-badges">
          <span className={`event-card-badge-type ${source}`}>
            {source === 'external' ? 'Public' : 'Local'}
          </span>
          {hobbyCategory && (
            <span className="event-card-badge-hobby">{hobbyCategory}</span>
          )}
        </div>
        {formattedDate && (
          <span className="event-card-date">{formattedDate}</span>
        )}
      </div>

      {/* ── Title ── */}
      <h3 className="event-card-title">{title}</h3>

      {/* ── Description ── */}
      {description && <p className="event-card-desc">{description}</p>}

      {/* ── Location meta ── */}
      <div className="event-card-meta">
        {location && (
          <span>
            <i className="fas fa-map-marker-alt" style={{ fontSize: '0.65rem' }}></i>
            {location}
          </span>
        )}
        {city && <span>{city}</span>}
        {createdBy?.name && <span>by {createdBy.name}</span>}
      </div>

      {/* ── Capacity (internal only) ── */}
      {source === 'internal' && (
        <div className="event-capacity-bar-container">
          <div className="event-capacity-label">
            <span>{currentParticipants} / {maxParticipants} going</span>
            {isFull ? (
              <span style={{ color: '#dc2626', fontWeight: 700 }}>Full</span>
            ) : spotsLeft <= 5 ? (
              <span style={{ color: '#d97706', fontWeight: 700 }}>{spotsLeft} spots left</span>
            ) : null}
          </div>
          <div className="event-capacity-track">
            <div
              className={`event-capacity-fill${fillPct >= 80 ? ' near-full' : ''}`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Action ── */}
      <div className="event-card-actions">
        {source === 'external' ? (
          <button className="btn-secondary" onClick={handleAction} style={{ flex: 1 }}>
            Get tickets <i className="fas fa-external-link-alt" style={{ fontSize: '0.7rem' }}></i>
          </button>
        ) : joined ? (
          <button className="btn-secondary" disabled style={{ flex: 1, opacity: 0.5 }}>
            ✓ Joined
          </button>
        ) : (
          <button
            className="btn-primary"
            onClick={handleAction}
            disabled={isFull}
            style={{ flex: 1 }}
          >
            {isFull ? 'Event full' : 'Join event'}
          </button>
        )}
      </div>
    </div>
  );
}
