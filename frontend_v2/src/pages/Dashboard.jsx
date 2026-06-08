import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import { showToast } from '../utils/toast';
import EmptyState from '../components/ui/EmptyState';

/**
 * Dashboard — home base: welcome, top matches, community feed.
 *
 * Discover and Events live on their own dedicated pages.
 * This page keeps things glanceable and action-oriented.
 */
export default function Dashboard() {
  const { token, logout, authFetch } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [confirmedMatches, setConfirmedMatches] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userArchetype, setUserArchetype] = useState('');
  const [postLikes, setPostLikes] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const postContentRef = useRef(null);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchCurrentUser();
    fetchPosts();
    fetchTopMatches();
    fetchConfirmedMatches();
  }, [token, navigate]);

  const fetchCurrentUser = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const res = await authFetch(`${API_BASE_URL}/api/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserName(data.name || 'Buddy');
        setUserArchetype(data.archetype || '');
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

  /** Fetch top 5 matches for the horizontal teaser strip */
  const fetchTopMatches = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const res = await authFetch(`${API_BASE_URL}/api/users/${userId}/find-buddy`);
      if (res.ok) {
        const data = await res.json();
        setMatches((data.matches || []).slice(0, 5).map(m => ({
          id: m.id, name: m.name, archetype: m.archetype,
          hobbies: m.hobbies, photosJson: m.photosJson,
          compatibilityPercentage: m.compatibilityPercentage || 50,
        })));
      }
    } catch (err) { console.error('Failed to fetch matches:', err); }
  };

  /** Fetch confirmed matches for the "Your matches" section */
  const fetchConfirmedMatches = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/match-requests`);
      if (res.ok) {
        const data = await res.json();
        const confirmed = (data.matchRequests || []).filter(m => m.status === 'CONFIRMED');
        setConfirmedMatches(confirmed);
      }
    } catch (err) { console.error('Failed to fetch confirmed matches:', err); }
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
    } catch { showToast('Failed to publish', 'error'); }
  };

  const handleLike = (postId) => {
    setPostLikes(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
    showToast('Liked!', 'success');
  };

  /** Qualitative match label — no raw percentage exposed */
  const getMatchLabel = (score) => {
    if (score >= 85) return 'Top match';
    if (score >= 70) return 'Strong fit';
    if (score >= 55) return 'Great vibe';
    return 'Vibe match';
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
      <div className="bg-mesh">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <nav className="navbar navbar-solid">
        <div className="nav-container">
          <Link to="/dashboard" className="logo">
            <i className="fas fa-users"></i><span>HobbyBuddy</span>
          </Link>
          <ul className="nav-menu">
            <li><Link to="/dashboard" className="active">Feed</Link></li>
            <li><Link to="/discover">Discover</Link></li>
            <li><Link to="/events">Events</Link></li>
            <li><Link to="/profile">Profile</Link></li>
          </ul>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '88px 24px 48px' }}>

        {/* ── Welcome ─────────────────────────── */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Welcome back, {userName} 👋
          </h1>
          {userArchetype && (
            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-muted)' }}>
              You're a <strong style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{userArchetype}</strong> — go meet your people.
            </p>
          )}
        </div>

        {/* ── Quick nav cards ──────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 36 }}>
          <Link to="/discover" className="card" style={{
            padding: '22px 20px', textDecoration: 'none', color: 'inherit',
            display: 'flex', flexDirection: 'column', gap: 8,
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}>
            <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>🔍</span>
            <h3 style={{ margin: 0, fontSize: '0.97rem', fontWeight: 700 }}>Discover people</h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
              Connect with people who share your vibe
            </p>
          </Link>
          <Link to="/events" className="card" style={{
            padding: '22px 20px', textDecoration: 'none', color: 'inherit',
            display: 'flex', flexDirection: 'column', gap: 8,
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}>
            <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>🎟️</span>
            <h3 style={{ margin: 0, fontSize: '0.97rem', fontWeight: 700 }}>Browse events</h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
              Find local meetups and things to do
            </p>
          </Link>
        </div>

        {/* ── Confirmed matches ────────────────── */}
        <div style={{ marginBottom: 44 }}>
          {confirmedMatches.length > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                  💬 Your matches
                </h2>
                <Link to="/discover" style={{ fontSize: '0.8rem', color: 'var(--color-accent-warm)', fontWeight: 600 }}>
                  Browse matches →
                </Link>
              </div>

              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
                {confirmedMatches.map(m => (
                  <Link key={m.id} to={`/messages?with=${m.buddyId}`} style={{
                    minWidth: 160, padding: '14px 16px', textDecoration: 'none', color: 'inherit',
                    borderRadius: 14, flexShrink: 0,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-card)',
                    transition: 'box-shadow 0.2s, border-color 0.2s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      color: '#92400e',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', fontWeight: 800, marginBottom: 10,
                      flexShrink: 0,
                    }}>
                      {m.buddyName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <h4 style={{ margin: '0 0 2px', fontSize: '0.88rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{m.buddyName}</h4>
                    <p style={{ margin: '0 0 8px', fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{m.buddyArchetype}</p>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.65rem', fontWeight: 700,
                      padding: '3px 10px', borderRadius: 100,
                      background: 'rgba(194, 65, 12, 0.06)',
                      color: 'var(--color-accent-warm)',
                      letterSpacing: '0.03em',
                      textTransform: 'uppercase',
                    }}>
                      Chat now
                    </span>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              icon="✨"
              title="No confirmed matches yet"
              body="Browse Discover, send a match request, and when they accept — you'll see them here."
              action={{ label: 'Discover people', href: '/discover' }}
            />
          )}
        </div>

        {/* ── Feed ─────────────────────────────── */}
        <div>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
            📰 Community feed
          </h2>

          {/* Post composer */}
          <div className="card" style={{ padding: '18px', marginBottom: 16 }}>
            <textarea
              ref={postContentRef}
              placeholder="What's on your mind?"
              rows={3}
              style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--color-text-main)', fontSize: '0.92rem', resize: 'vertical',
                lineHeight: 1.5, fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
              <button className="btn-primary" onClick={handlePublishPost} style={{ padding: '7px 20px', fontSize: '0.82rem' }}>
                <i className="fas fa-paper-plane"></i> Post
              </button>
            </div>
          </div>

          {/* Posts */}
          {posts.length === 0 ? (
            <EmptyState
              icon="🌱"
              title="Nothing here yet"
              body="Be the first to share something with the community."
            />
          ) : (
            posts.map(post => (
              <div key={post.id} className="card" style={{ padding: '18px', marginBottom: 12 }}>
                {/* Author row */}
                {post.author?.name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.72rem', fontWeight: 800, flexShrink: 0,
                    }}>
                      {post.author.name[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{post.author.name}</span>
                  </div>
                )}

                <p style={{ margin: '0 0 12px', fontSize: '0.92rem', lineHeight: 1.6 }}>{post.content}</p>

                {/* Actions row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn-secondary"
                      onClick={() => handleLike(post.id)}
                      style={{ padding: '5px 14px', fontSize: '0.75rem' }}
                    >
                      ❤️ {postLikes[post.id] || post.likesCount || post.likes || 0}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                      style={{ padding: '5px 14px', fontSize: '0.75rem' }}
                    >
                      💬
                    </button>
                  </div>
                </div>

                {/* ── Comment placeholder (coming soon) ── */}
                {expandedComments[post.id] && (
                  <div style={{
                    marginTop: 14, borderTop: '1px solid var(--color-border)', paddingTop: 14,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ fontSize: '0.85rem' }}>💬</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      Conversations open here soon
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
