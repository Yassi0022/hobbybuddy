import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, HOBBY_CATEGORIES } from '../utils/constants';
import { showToast } from '../utils/toast';
import PhotoUpload from '../components/ui/PhotoUpload';
import Navbar from '../components/ui/Navbar';
import { ProfileProgress } from '../ProfileProgress';
import SocialShare from '../SocialShare';

export default function Profile() {
  const { token, authFetch } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    city: '',
    age: '',
    prompt1: '',
    prompt2: '',
    prompt3: '',
    personalityTagline: '',
    hobbies: '',
    photosJson: '[]',
  });
  const [selectedHobbies, setSelectedHobbies] = useState(new Set());
  const [photos, setPhotos] = useState(['', '', '']);

  const fetchProfile = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const res = await authFetch(`${API_BASE_URL}/api/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile({
          name: data.name || '',
          city: data.city || '',
          age: data.age || '',
          prompt1: data.prompt1 || '',
          prompt2: data.prompt2 || '',
          prompt3: data.prompt3 || '',
          personalityTagline: data.personalityTagline || '',
          hobbies: data.hobbies || '',
          photosJson: data.photosJson || '[]',
        });
        if (data.hobbies) {
          setSelectedHobbies(new Set(data.hobbies.split(',').map(h => h.trim()).filter(Boolean)));
        }
        try {
          const p = JSON.parse(data.photosJson || '[]');
          setPhotos([p[0] || '', p[1] || '', p[2] || '']);
        } catch { setPhotos(['', '', '']); }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const timer = setTimeout(() => fetchProfile(), 0);
    return () => clearTimeout(timer);
  }, [token, navigate]);

  const toggleHobby = (hobby) => {
    const isRemoving = selectedHobbies.has(hobby);
    const willExceed = !isRemoving && selectedHobbies.size >= 5;
    if (willExceed) { showToast('Max 5 hobbies', 'error'); return; }
    setSelectedHobbies((prev) => {
      const next = new Set(prev);
      if (next.has(hobby)) { next.delete(hobby); return next; }
      next.add(hobby);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userId = localStorage.getItem('userId');
      const validPhotos = photos.filter(p => p.trim());
      const payload = {
        ...profile,
        hobbies: Array.from(selectedHobbies).join(','),
        photosJson: JSON.stringify(validPhotos),
        age: profile.age ? parseInt(profile.age) : null,
      };
      const res = await authFetch(`${API_BASE_URL}/api/users/${userId}/profile`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast('Profile updated!', 'success');
        navigate('/dashboard');
      } else {
        showToast('Failed to save profile', 'error');
      }
    } catch {
      showToast('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const computeProfilePercent = () => {
    let count = 0;
    try {
      const raw = profile?.photosJson;
      if (typeof raw === 'string' && raw.trim() !== '') {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          count = parsed.filter((item) => typeof item === 'string' && item.trim().length > 0).length;
        }
      }
    } catch {
      count = 0;
    }
    const percent = count > 0 ? 70 : 30;
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) return 30;
    return Math.round(Math.max(0, Math.min(100, percent)));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="spinner-border"></div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-mesh"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>
      <Navbar brandLink="/dashboard" showLinks={[
        { to: '/dashboard', label: 'Feed' },
        { to: '/discover', label: 'Discover' },
        { to: '/events', label: 'Events' },
        { to: '/profile', label: 'Profile' },
      ]} />

      <div style={{ maxWidth: '800px', margin: '100px auto 60px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px' }}>Edit Your Profile</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Make your profile feel like you</p>
        </div>

        <ProfileProgress percent={computeProfilePercent()} />

        {(() => {
          const userId = typeof localStorage !== 'undefined' ? localStorage.getItem('userId') : null;
          if (!userId || userId.trim() === '') {
            return (
              <div style={{ marginBottom: 16, padding: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, color: '#92400e', fontSize: '0.85rem' }} aria-live="polite">
                Public profile share unavailable — please sign in to access your profile link.
              </div>
            );
          }
          const publicUrl = (typeof window !== 'undefined' ? window.location.origin : '') + '/profile/' + userId;
          return <SocialShare url={publicUrl} />;
        })()}

        <div className="auth-card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}><i className="fas fa-user" style={{ color: 'var(--color-accent-warm)', marginRight: '10px' }}></i>Basic Info</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="profile-name"><i className="fas fa-user"></i> Display Name</label>
              <input type="text" id="profile-name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Your name" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="profile-city"><i className="fas fa-map-marker-alt"></i> City</label>
                <input type="text" id="profile-city" value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} placeholder="Your city" />
              </div>
              <div className="form-group">
                <label htmlFor="profile-age"><i className="fas fa-birthday-cake"></i> Age</label>
                <input type="number" id="profile-age" value={profile.age} onChange={(e) => setProfile({ ...profile, age: e.target.value })} placeholder="Your age" min="18" max="120" />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="profile-tagline"><i className="fas fa-quote-left"></i> Personality Tagline</label>
              <input type="text" id="profile-tagline" value={profile.personalityTagline} onChange={(e) => setProfile({ ...profile, personalityTagline: e.target.value })} placeholder="A short description of your vibe" maxLength="100" />
            </div>
          </div>
        </div>

        <div className="auth-card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}><i className="fas fa-camera" style={{ color: 'var(--color-accent-warm)', marginRight: '10px' }}></i>Profile Photos</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>Add up to 3 photos — drag & drop or click to upload</p>
          <PhotoUpload photos={photos} onChange={setPhotos} maxPhotos={3} />
        </div>

        <div className="auth-card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}><i className="fas fa-heart" style={{ color: 'var(--color-accent-warm)', marginRight: '10px' }}></i>Hobbies</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>Select 3–5 hobbies that define you</p>
          {HOBBY_CATEGORIES.map((cat) => (
            <div key={cat.name} style={{ marginBottom: 18 }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 8 }}>{cat.name}</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {cat.hobbies.map((hobby) => (
                  <button key={hobby} type="button" className={selectedHobbies.has(hobby) ? 'btn-primary' : 'btn-secondary'} style={{ borderRadius: '100px', padding: '8px 16px', fontSize: '0.88rem' }} onClick={() => toggleHobby(hobby)}>
                    {hobby}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="auth-card" style={{ marginBottom: '40px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}><i className="fas fa-comments" style={{ color: 'var(--color-accent-warm)', marginRight: '10px' }}></i>Icebreaker Prompts</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>Answer these to help matches start conversations</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="prompt1"><i className="fas fa-lightbulb"></i> A random fact about me is...</label>
              <input type="text" id="prompt1" value={profile.prompt1} onChange={(e) => setProfile({ ...profile, prompt1: e.target.value })} placeholder="Share something interesting!" maxLength="150" />
            </div>
            <div className="form-group">
              <label htmlFor="prompt2"><i className="fas fa-utensils"></i> My ideal weekend involves...</label>
              <input type="text" id="prompt2" value={profile.prompt2} onChange={(e) => setProfile({ ...profile, prompt2: e.target.value })} placeholder="Describe your perfect weekend" maxLength="150" />
            </div>
            <div className="form-group">
              <label htmlFor="prompt3"><i className="fas fa-star"></i> I'm looking for someone who...</label>
              <input type="text" id="prompt3" value={profile.prompt3} onChange={(e) => setProfile({ ...profile, prompt3: e.target.value })} placeholder="What kind of buddy are you looking for?" maxLength="150" />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button className="btn-secondary" onClick={() => navigate('/dashboard')} style={{ padding: '14px 32px' }}>
            Cancel
          </button>
          <button className="btn-primary btn-large" onClick={handleSave} disabled={saving}>
            {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save Profile</>}
          </button>
        </div>
      </div>
    </>
  );
}
