/* Profile completion progress indicator */
export function ProfileProgress({ percent = 60 }) {
  const suggestions = [
    percent < 40 ? 'Add a profile photo' : null,
    percent < 70 ? 'Write a short bio' : null,
    percent < 90 ? 'Add your hobbies' : null,
  ].filter(Boolean);
  return (
    <div className="profile-progress" aria-label="Profile progress indicator" style={{ maxWidth: 480, padding: '1.5rem', background: '#fff', borderRadius: 16, boxShadow: '0 10px 30px rgba(194,65,12,0.08)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c2410c', marginBottom: '.5rem' }}>Profile Completion</h3>
      <div style={{ height: 12, background: '#f0ebe5', borderRadius: 999, overflow: 'hidden', marginBottom: '.75rem' }}>
        <div style={{ width: `${percent}%`, height: '100%', background: '#c2410c', borderRadius: 999, transition: 'width .5s ease' }} />
      </div>
      <p style={{ fontWeight: 700, color: '#2d1810', marginBottom: '.25rem' }} aria-live="polite" aria-atomic="true">{percent}% complete</p>
      {suggestions.length > 0 ? (
        <ul style={{ paddingLeft: '1.25rem', color: '#5a3e2b', fontSize: '.9rem', marginTop: '.5rem' }}>
          {suggestions.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      ) : (
        <p style={{ fontSize: '.9rem', color: '#5a3e2b', marginTop: '.5rem' }}>Your profile is almost complete!</p>
      )}
    </div>
  );
}
