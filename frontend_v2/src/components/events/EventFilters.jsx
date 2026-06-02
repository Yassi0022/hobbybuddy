/**
 * Event filter bar — editorial, restrained.
 * Source tabs + hobby filter.
 */
export default function EventFilters({ filters, onChange, onApply }) {
  const sources = [
    { value: 'all', label: 'All' },
    { value: 'internal', label: 'Local' },
    { value: 'external', label: 'Public' },
  ];

  const hobbies = [
    '', 'Photography', 'Hiking', 'Music', 'Cooking',
    'Art', 'Fitness', 'Board Games', 'Cinema',
    'Dancing', 'Yoga', 'Reading', 'Gaming',
    'Cycling', 'Volunteering', 'Travel',
  ];

  return (
    <div className="event-filters-bar">
      {/* Source tabs */}
      <div className="event-filters-sources">
        {sources.map(s => (
          <button
            key={s.value}
            className={`event-filters-tab${filters.source === s.value ? ' active' : ''}`}
            onClick={() => { onChange('source', s.value); onApply(0); }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Hobby filter */}
      <select
        className="event-filters-select"
        value={filters.hobby || ''}
        onChange={(e) => { onChange('hobby', e.target.value); onApply(0); }}
      >
        <option value="">All hobbies</option>
        {hobbies.filter(h => h).map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
    </div>
  );
}
