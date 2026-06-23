import { HOBBIES_LIST } from '../../utils/constants';

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

  // Derive hobby names from the canonical constants list.
  // HOBBIES_LIST entries use the format "Name emoji" (e.g. "Photography 📷").
  // We extract just the name portion for the filter, keeping the first segment.
  const hobbyNames = [...new Set(
    HOBBIES_LIST.map(h => h.replace(/\s*[^\w\s].*$/, '').trim())
  )].sort();

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
        {hobbyNames.map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
    </div>
  );
}
