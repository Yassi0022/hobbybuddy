import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, HOBBIES_LIST } from '../utils/constants';
import { showToast } from '../utils/toast';
import { copyInviteLink } from '../utils/share';

export default function Dashboard() {
  const { token, user, logout, authFetch } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('home');
  const [matches, setMatches] = useState([]);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userHobbies, setUserHobbies] = useState('');
  const [userArchetype, setUserArchetype] = useState('');
  const [userPhotos, setUserPhotos] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', location: '', hobby: '', maxParticipants: 10 });
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [postLikes, setPostLikes] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const postContentRef = useRef(null);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchCurrentUser();
  }, [token, navigate]);

  useEffect(() => {
    if (activeView === 'home') fetchPosts();
    if (activeView === 'discover') fetchDiscover();
    if (activeView === 'events') fetchEvents();
  }, [activeView]);

  const fetchCurrentUser = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const res = await authFetch(`${API_BASE_URL}/api/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserName(data.name || 'Buddy');
        setUserHobbies(data.hobbies || '');
        setUserArchetype(data.archetype || '');
        try { setUserPhotos(JSON.parse(data.photosJson || '[]')); } catch { setUserPhotos([]); }
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/posts`);
      if (res.ok) setPosts(await res.json());
    } catch (err) { console.error('Failed to fetch posts:', err); }
  };

  const fetchDiscover = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const res = await authFetch(`${API_BASE_URL}/api/users/${userId}/find-buddy`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || data || []);
      }
    } catch (err) { console.error('Failed to fetch matches:', err); }
  };

  const fetchEvents = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/events`);
      if (res.ok) setEvents(await res.json());
    } catch (err) { console.error('Failed to fetch events:', err); }
  };

  const handlePublishPost = async () => {
    const content = postContentRef.current?.value?.trim();
    if (!content) { showToast('Write something first!', 'error'); return; }
    try {
      const res = await authFetch(`${API_BASE_URL}/api/posts`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        postContentRef.current.value = '';
        fetchPosts();
        showToast('Post published!', 'success');
      }
    } catch (err) { showToast('Failed to publish', 'error'); }
  };

  const handleLike = (postId) => {
    setPostLikes(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
    showToast('Liked!', 'success');
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.location) { showToast('Title and location required', 'error'); return; }
    setCreatingEvent(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        body: JSON.stringify(eventForm),
      });
      if (res.ok) {
        showToast('Event created!', 'success');
        setEventForm({ title: '', description: '', location: '', hobby: '', maxParticipants: 10 });
        setShowEventForm(false);
        fetchEvents();
      } else {
        showToast('Failed to create event', 'error');
      }
    } catch (err) { showToast('Failed to create event', 'error'); }
    finally { setCreatingEvent(false); }
  };

  const handleJoinEvent = async (eventId) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/events/${eventId}/join`, { method: 'POST' });
      if (res.ok) { showToast('Joined event!', 'success'); fetchEvents(); }
      else showToast('Could not join event', 'error');
    } catch { showToast('Could not join event', 'error'); }
  };

  const handleInvite = async () => {
    try { await copyInviteLink(); showToast('Invite link copied!', 'success'); }
    catch { showToast('Failed to copy', 'error'); }
  };

  const getMatchLabel = (score) => {
    if (score >= 90) return 'Perfect Match';
    if (score >= 75) return 'Great Match';
    if (score >= 60) return 'Good Match';
    return 'Potential Match';
  };

  const getMatchColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#6366f1';
    if (score >= 60) return '#f59e0b';
    return '#94a3b8';
  };

  const handleLogout = () => { logout(); navigate('/login'); };

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

      <nav className="navbar navbar-solid">
        <div className="nav-container">
          <Link to="/" className="logo"><i className="fas fa-users"></i><span>HobbyBuddy</span></Link>
          <button className={`hamburger ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
          <ul className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
            <li><Link to="/profile" onClick={() => setMobileMenuOpen(false)}><i className="fas fa-user-edit"></i> Edit Profile</Link></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="cta-button">Sign Out</a></li>
          </ul>
        </div>
      </nav>

      <div className="dashboard-layout">
        {/* Left Sidebar */}
        <aside className="sidebar">
          <div className="user-profile-mini">
            <div className="avatar-lg">
              {userPhotos[0] ? <img src={userPhotos[0]} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <i className="fas fa-user"></i>}
            </div>
            <h3>{userName}</h3>
            {userArchetype && <span className="badge" style={{ marginTop: '8px', fontSize: '0.8rem' }}>✨ {userArchetype}</span>}
            <p style={{ marginTop: '8px' }}>{userHobbies ? userHobbies.split(',').slice(0, 3).join(' • ') : 'Explorer & Enthusiast'}</p>
            <Link to="/profile" className="btn-outline btn-sm" style={{ marginTop: '12px', width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}>
              <i className="fas fa-edit"></i> Edit Profile
            </Link>
          </div>

          <nav className="sidebar-menu">
            <button className={`menu-item ${activeView === 'home' ? 'active' : ''}`} onClick={() => setActiveView('home')}>
              <i className="fas fa-home"></i> Community Feed
            </button>
            <button className={`menu-item ${activeView === 'discover' ? 'active' : ''}`} onClick={() => setActiveView('discover')}>
              <i className="fas fa-compass"></i> Discover Buddies
            </button>
            <button className={`menu-item ${activeView === 'messages' ? 'active' : ''}`} onClick={() => setActiveView('messages')}>
              <i className="fas fa-comments"></i> Private Chats
            </button>
            <button className={`menu-item ${activeView === 'events' ? 'active' : ''}`} onClick={() => setActiveView('events')}>
              <i className="fas fa-calendar-alt"></i> Local Events
            </button>
          </nav>

          <div className="trending-card" style={{ marginTop: '20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(236,72,153,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
            <h3 style={{ marginBottom: '10px', fontSize: '1rem' }}><i className="fas fa-gift" style={{ color: 'var(--color-accent-violet)' }}></i> Invite Friends</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>Share HobbyBuddy and grow your buddy network!</p>
            <button className="btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }} onClick={handleInvite}>
              <i className="fas fa-share-alt"></i> Copy Invite Link
            </button>
          </div>

          <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '20px 0', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.8rem', marginBottom: '15px', opacity: 0.6, display: 'flex', gap: '10px' }}>
              <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
              <span>&bull;</span>
              <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
            </div>
            <button className="btn-outline" style={{ width: '100%', justifyContent: 'center', color: 'var(--color-error)', borderColor: 'transparent' }} onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="feed-content">
          {/* HOME VIEW */}
          {activeView === 'home' && (
            <>
              <section>
                <div className="section-header">
                  <h2><i className="fas fa-star"></i> Your Top Matches</h2>
                  <button className="btn-outline" onClick={() => setActiveView('discover')}><i className="fas fa-sync-alt"></i> Refresh</button>
                </div>
                <div className="matches-scroll">
                  {matches.length === 0 ? (
                    <div className="match-card-social" style={{ width: '100%', borderStyle: 'dashed' }}>
                      <div className="match-avatar-social" style={{ background: 'transparent' }}><i className="fas fa-user-friends"></i></div>
                      <h3>No matches yet</h3>
                      <p>Click Discover to find buddies!</p>
                    </div>
                  ) : matches.slice(0, 5).map((m) => (
                    <div key={m.id} className="match-card-social" style={{ minWidth: '200px' }}>
                      <div className="match-avatar-social">
                        {m.photosJson ? (() => { try { const p = JSON.parse(m.photosJson); return p[0] ? <img src={p[0]} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : null; } catch { return null; } })() : null}
                        {!m.photosJson && <i className="fas fa-user"></i>}
                      </div>
                      <h4>{m.name}</h4>
                      <span className="badge success">{getMatchLabel(m.matchVibeScore?.[0] || m.compatibilityScore || 85)}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="section-header">
                  <h2><i className="fas fa-stream"></i> Community Activity</h2>
                </div>

                <div className="create-post-card">
                  <div className="create-post-header">
                    <div className="avatar-sm">
                      {userPhotos[0] ? <img src={userPhotos[0]} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <i className="fas fa-user"></i>}
                    </div>
                    <textarea ref={postContentRef} placeholder="Share something with your hobby buddies..." rows="2"></textarea>
                  </div>
                  <div className="create-post-actions">
                    <div className="post-tool-group">
                      <span className="post-tool"><i className="fas fa-hashtag"></i> Hobby</span>
                    </div>
                    <button className="btn-primary btn-sm" onClick={handlePublishPost}><i className="fas fa-paper-plane"></i> Post</button>
                  </div>
                </div>

                {posts.length === 0 ? (
                  <div className="post-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <i className="fas fa-stream" style={{ fontSize: '2rem', color: 'var(--color-input-border)', marginBottom: '15px', display: 'block' }}></i>
                    <p style={{ color: 'var(--color-text-light)' }}>No posts yet. Be the first to share!</p>
                  </div>
                ) : posts.map((post) => (
                  <div key={post.id} className="post-card fade-in">
                    <div className="post-header">
                      <div className="avatar-sm"><i className="fas fa-user"></i></div>
                      <div className="post-meta">
                        <h4>{post.author?.name || 'User'}</h4>
                        <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Just now'}</span>
                      </div>
                    </div>
                    <div className="post-content"><p>{post.content}</p></div>
                    <div className="post-actions">
                      <span className="post-action" onClick={() => handleLike(post.id)}>
                        <i className="fas fa-heart" style={{ color: 'var(--color-secondary)' }}></i> {postLikes[post.id] || 0}
                      </span>
                      <span className="post-action"><i className="fas fa-comment"></i> Reply</span>
                      <span className="post-action"><i className="fas fa-share"></i> Share</span>
                    </div>
                  </div>
                ))}
              </section>
            </>
          )}

          {/* DISCOVER VIEW */}
          {activeView === 'discover' && (
            <div>
              <div className="section-header">
                <h2><i className="fas fa-users"></i> Discover New Buddies</h2>
                <button className="btn-outline" onClick={fetchDiscover}><i className="fas fa-sync-alt"></i> Refresh</button>
              </div>
              <div className="discover-grid">
                {matches.length === 0 ? (
                  <div className="empty-state" style={{ gridColumn: '1/-1', padding: '60px 20px', textAlign: 'center' }}>
                    <i className="fas fa-user-friends" style={{ fontSize: '3rem', color: 'var(--color-input-border)', marginBottom: '20px', display: 'block' }}></i>
                    <h3>No matches yet</h3>
                    <p>Complete your profile and try again!</p>
                  </div>
                ) : matches.map((m) => {
                  const score = m.matchVibeScore?.[0] || m.compatibilityScore || 75;
                  return (
                    <div key={m.id} className="discover-card fade-in">
                      <div className="discover-card-img">
                        {m.photosJson ? (() => { try { const p = JSON.parse(m.photosJson); return p[0] ? <img src={p[0]} alt={m.name} /> : null; } catch { return null; } })() : null}
                        {!m.photosJson && <div style={{ width: '100%', height: '100%', background: 'var(--color-input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-user" style={{ fontSize: '3rem', color: 'var(--color-text-light)' }}></i></div>}
                        <div className="discover-badge badge success">{getMatchLabel(score)}</div>
                      </div>
                      <div className="discover-card-content">
                        <h3>{m.name}{m.age ? `, ${m.age}` : ''}</h3>
                        <p className="tagline">{m.personalityTagline || 'Looking for hobby buddies'}</p>
                        {m.archetype && <span className="badge" style={{ fontSize: '0.75rem', marginBottom: '8px' }}>✨ {m.archetype}</span>}
                        <div className="tags" style={{ justifyContent: 'flex-start', marginTop: 'auto' }}>
                          {(m.hobbies || '').split(',').slice(0, 3).map((h) => <span key={h} className="tag">{h.trim()}</span>)}
                        </div>
                      </div>
                      <div className="discover-card-footer">
                        <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }} onClick={() => showToast(`Connection request sent to ${m.name}!`, 'success')}>
                          <i className="fas fa-user-plus"></i> Connect
                        </button>
                        <button className="btn-outline" style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }} onClick={() => showToast('Chat feature coming soon!', 'success')}>
                          <i className="fas fa-comment"></i> Message
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MESSAGES VIEW */}
          {activeView === 'messages' && (
            <div>
              <div className="section-header">
                <h2><i className="fas fa-envelope"></i> Connections</h2>
              </div>
              <div className="post-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
                <i className="fas fa-comments" style={{ fontSize: '3rem', color: 'var(--color-input-border)', marginBottom: '20px', display: 'block' }}></i>
                <h3>Your inbox is empty</h3>
                <p>Connect with buddies to start chatting.</p>
                <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => setActiveView('discover')}>
                  <i className="fas fa-compass"></i> Discover Buddies
                </button>
              </div>
            </div>
          )}

          {/* EVENTS VIEW */}
          {activeView === 'events' && (
            <div>
              <div className="section-header">
                <h2><i className="fas fa-calendar-alt"></i> Local Events</h2>
                <button className="btn-primary btn-sm" onClick={() => setShowEventForm(!showEventForm)}>
                  <i className="fas fa-plus"></i> Create Event
                </button>
              </div>

              {showEventForm && (
                <div className="auth-card" style={{ marginBottom: '30px' }}>
                  <h3 style={{ marginBottom: '20px' }}><i className="fas fa-calendar-plus" style={{ color: 'var(--color-accent-violet)', marginRight: '10px' }}></i>Create New Event</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                      <label>Event Title *</label>
                      <input type="text" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="e.g. Weekend Hiking Trip" />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} placeholder="What's this event about?" rows="3" style={{ width: '100%', padding: '12px 16px', background: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', borderRadius: 'var(--radius-md)', fontFamily: 'inherit', fontSize: '0.95rem', resize: 'none' }}></textarea>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label>Location *</label>
                        <input type="text" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder="City or venue" />
                      </div>
                      <div className="form-group">
                        <label>Related Hobby</label>
                        <select value={eventForm.hobby} onChange={(e) => setEventForm({ ...eventForm, hobby: e.target.value })} style={{ width: '100%', padding: '12px 16px', background: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', borderRadius: 'var(--radius-md)', fontFamily: 'inherit', fontSize: '0.95rem' }}>
                          <option value="">Select hobby</option>
                          {HOBBIES_LIST.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Max Participants</label>
                      <input type="number" value={eventForm.maxParticipants} onChange={(e) => setEventForm({ ...eventForm, maxParticipants: parseInt(e.target.value) || 10 })} min="2" max="100" />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button className="btn-secondary" onClick={() => setShowEventForm(false)}>Cancel</button>
                      <button className="btn-primary" onClick={handleCreateEvent} disabled={creatingEvent}>
                        {creatingEvent ? <><i className="fas fa-spinner fa-spin"></i> Creating...</> : <><i className="fas fa-check"></i> Create Event</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="events-grid">
                {events.length === 0 ? (
                  <div className="empty-state" style={{ gridColumn: '1/-1', padding: '60px 20px', textAlign: 'center' }}>
                    <i className="fas fa-calendar-times" style={{ fontSize: '3rem', color: 'var(--color-input-border)', marginBottom: '20px', display: 'block' }}></i>
                    <h3>No events yet</h3>
                    <p>Be the first to create an event!</p>
                  </div>
                ) : events.map((evt) => (
                  <div key={evt.id} className="event-card">
                    <div className="event-card-header">
                      <span className="badge"><i className="fas fa-calendar"></i> {evt.hobby || 'Social'}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        {evt.participants ? evt.participants.length : 0}/{evt.maxParticipants || '∞'} attending
                      </span>
                    </div>
                    <h3 className="event-card-title">{evt.title}</h3>
                    {evt.description && <p style={{ color: 'var(--color-text-muted)', marginBottom: '12px', fontSize: '0.95rem' }}>{evt.description}</p>}
                    <div className="event-info-row"><i className="fas fa-map-marker-alt"></i> {evt.location}</div>
                    {evt.eventDate && <div className="event-info-row"><i className="fas fa-clock"></i> {new Date(evt.eventDate).toLocaleDateString()}</div>}
                    <div className="event-card-footer">
                      <div className="participants-mini">
                        <i className="fas fa-users" style={{ color: 'var(--color-accent-violet)' }}></i>
                        <span>{evt.participants ? evt.participants.length : 0} going</span>
                      </div>
                      <button className="btn-primary btn-sm" onClick={() => handleJoinEvent(evt.id)}>
                        <i className="fas fa-plus"></i> Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="sidebar">
          <div className="trending-card">
            <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}><i className="fas fa-chart-line" style={{ color: 'var(--color-accent-rose)' }}></i> Trending Hobbies</h3>
            {[
              { name: 'Urban Photography', count: '120 active', pct: '+15%' },
              { name: 'Group Hiking', count: '85 active', pct: '+8%' },
              { name: 'Board Games', count: '200 active', pct: '+4%' },
              { name: 'Tech Startups', count: '95 active', pct: '+22%' },
            ].map((t) => (
              <div key={t.name} className="trending-item">
                <div className="trending-info"><h4>{t.name}</h4><p>{t.count}</p></div>
                <span className="trending-count">{t.pct}</span>
              </div>
            ))}
          </div>

          <div className="trending-card" style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '10px', fontSize: '1.1rem' }}><i className="fas fa-bullhorn" style={{ color: 'var(--color-accent-violet)' }}></i> Share & Earn</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '12px' }}>Invite friends and unlock premium features!</p>
            <button className="btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={handleInvite}>
              <i className="fas fa-share-alt"></i> Invite Now
            </button>
          </div>

          <div className="trending-card" style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '10px', fontSize: '1.1rem' }}><i className="fas fa-info-circle"></i> About HobbyBuddy</h3>
            <p style={{ fontSize: '0.85rem' }}>Your vibrant community powered by IPIP Big-Five valid personality matching.</p>
            <div style={{ marginTop: '15px', display: 'flex', gap: '15px', fontSize: '0.8rem', opacity: 0.6 }}>
              <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
              <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
