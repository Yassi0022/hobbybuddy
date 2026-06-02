import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/constants';
import { showToast } from '../../utils/toast';

/**
 * Create event modal — warm editorial surface.
 * Fields: title, description, location, hobbyCategory, maxParticipants, date.
 */
export default function CreateEventModal({ city, onClose, onCreated }) {
  const { authFetch } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: city || '',
    hobbyCategory: 'Social',
    maxParticipants: 15,
    date: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const hobbies = [
    'Photography 📷', 'Hiking 🥾', 'Music 🎵', 'Cooking 🍳',
    'Art 🎨', 'Fitness 💪', 'Board Games 🎲', 'Cinema 🎬',
    'Dancing 💃', 'Yoga 🧘', 'Reading 📚', 'Gaming 🎮',
    'Cycling 🚴', 'Volunteering 🤝', 'Travel ✈️', 'Social',
  ];

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.location) {
      showToast('Title and location are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast('Event created!', 'success');
        onCreated();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to create event', 'error');
      }
    } catch {
      showToast('Failed to create event', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    background: '#ffffff', border: '1px solid #e2e8f0',
    color: 'var(--color-text-main)', fontSize: '0.9rem', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: 'inherit',
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'auto',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
      padding: 24,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--color-surface)',
        borderRadius: 20, padding: 28,
        border: '1px solid var(--color-border)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.06), 0 4px 10px rgba(0,0,0,0.03)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-main)' }}>Create event</h2>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', fontSize: '1.2rem',
            color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4,
          }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{
              fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)',
              marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>Title *</label>
            <input
              type="text" value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g. Weekly Hike at Appia"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent-warm)'; e.target.style.boxShadow = '0 0 0 3px rgba(194, 65, 12, 0.08)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div>
            <label style={{
              fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)',
              marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Tell people what to expect..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent-warm)'; e.target.style.boxShadow = '0 0 0 3px rgba(194, 65, 12, 0.08)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{
                fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)',
                marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>Location *</label>
              <input
                type="text" value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g. Parco della Caffarella"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent-warm)'; e.target.style.boxShadow = '0 0 0 3px rgba(194, 65, 12, 0.08)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label style={{
                fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)',
                marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>Hobby</label>
              <select
                value={form.hobbyCategory}
                onChange={(e) => handleChange('hobbyCategory', e.target.value)}
                style={selectStyle}
              >
                {hobbies.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{
                fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)',
                marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>Max participants</label>
              <input
                type="number" value={form.maxParticipants}
                onChange={(e) => handleChange('maxParticipants', parseInt(e.target.value) || 10)}
                min={2} max={200}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent-warm)'; e.target.style.boxShadow = '0 0 0 3px rgba(194, 65, 12, 0.08)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label style={{
                fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)',
                marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>Date & time</label>
              <input
                type="datetime-local" value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent-warm)'; e.target.style.boxShadow = '0 0 0 3px rgba(194, 65, 12, 0.08)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 1 }}>
              {submitting ? <><i className="fas fa-spinner fa-spin"></i> Creating...</> : <><i className="fas fa-plus"></i> Create event</>}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
