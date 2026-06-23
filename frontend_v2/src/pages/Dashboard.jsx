import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import { showToast } from '../utils/toast';
import EmptyState from '../components/ui/EmptyState';
import Navbar from '../components/ui/Navbar';
import { copyInviteLink } from '../utils/share';
import styles from '../styles/dashboard.module.css';

/* ── Demo mode: activated by Ctrl+Shift+D or typing "demo" ── */
const DEMO_POSTS = [
  {
    id: 'demo-1',
    content: 'Just matched with someone who shares my love for hiking and photography! Can\'t wait to explore the trails together this weekend 📸🥾',
    author: { name: 'Sarah Chen' },
    createdAt: new Date(Date.now() - 1000 * 60 * 23).toISOString(),
    likesCount: 12,
  },
  {
    id: 'demo-2',
    content: 'Took the HobbyBuddy personality quiz and found out I\'m a "Creative Catalyst" — makes so much sense! Already connected with 3 people who vibe the same way ✨',
    author: { name: 'Marcus Rivera' },
    createdAt: new Date(Date.now() - 1000 * 60 * 67).toISOString(),
    likesCount: 24,
  },
  {
    id: 'demo-3',
    content: 'Hosted a board game night last Friday through HobbyBuddy — 8 people showed up and we stayed until 2 AM. Already planning the next one! 🎲',
    author: { name: 'Aisha Patel' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    likesCount: 31,
  },
  {
    id: 'demo-4',
    content: "Grew up thinking I was the only person who loved stargazing AND cooking. Found my vibe tribe on day one here. We're planning a cookout under the Lyrid meteor shower 🌠",
    author: { name: 'Erik Johansson' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    likesCount: 45,
  },
  {
    id: 'demo-5',
    content: 'Honestly didn\'t expect much from a personality quiz but the matching is scarily good. Paired with two other "Steady Anchors" and we already have a weekly coffee ritual ☕',
    author: { name: 'Lena Okafor' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    likesCount: 18,
  },
];

const DEMO_MATCHES = [
  { id: 'dm-1', buddyId: 101, buddyName: 'Sarah Chen', buddyArchetype: 'Creative Catalyst' },
  { id: 'dm-2', buddyId: 102, buddyName: 'Marcus Rivera', buddyArchetype: 'Social Spark' },
  { id: 'dm-3', buddyId: 103, buddyName: 'Aisha Patel', buddyArchetype: 'Steady Anchor' },
];

/**
 * Dashboard — home base: welcome, top matches, community feed.
 *
 * Discover and Events live on their own dedicated pages.
 * This page keeps things glanceable and action-oriented.
 */
export default function Dashboard() {
  const { token, logout, authFetch } = useAuth();
  const navigate = useNavigate();
  const [confirmedMatches, setConfirmedMatches] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userArchetype, setUserArchetype] = useState('');
  const [postLikes, setPostLikes] = useState({});
  const [demoActive, setDemoActive] = useState(false);
  const postContentRef = useRef(null);
  const demoKeyBuf = useRef('');

  /* ── Hidden demo mode: Ctrl+Shift+D or type "demo" ── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+D toggle
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDemoActive(prev => {
          const next = !prev;
          showToast(next ? '🎬 Demo mode activated' : '🎬 Demo mode deactivated', 'success');
          return next;
        });
        return;
      }
      // Type "demo" (case-insensitive) to toggle
      demoKeyBuf.current = (demoKeyBuf.current + e.key).slice(-4);
      if (demoKeyBuf.current.toLowerCase() === 'demo') {
        demoKeyBuf.current = '';
        setDemoActive(prev => {
          const next = !prev;
          showToast(next ? '🎬 Demo mode activated' : '🎬 Demo mode deactivated', 'success');
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchCurrentUser();
    fetchPosts();
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

  /** Demo data merges on top of real data when demo mode is active */
  const displayPosts = demoActive && posts.length === 0 ? DEMO_POSTS : posts;
  const displayMatches = demoActive && confirmedMatches.length === 0 ? DEMO_MATCHES : confirmedMatches;

  if (loading) {
    return (
      <>
        <div className="bg-mesh"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>
        <Navbar />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="bg-mesh">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <Navbar />

      <div className={styles.dashboardContainer}>

        {/* ── Welcome ─────────────────────────── */}
        <div className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>
            Welcome back, {userName} 👋
          </h1>
          {userArchetype && (
            <p className={styles.welcomeArchetype}>
              You're a <strong>{userArchetype}</strong> — go meet your people.
            </p>
          )}
        </div>

        {/* ── Invite Friends ────────────────────── */}
        <div className={styles.inviteCard}>
          <div className={styles.inviteContent}>
            <div className={styles.inviteIcon}>💌</div>
            <div className={styles.inviteText}>
              <h3 className={styles.inviteTitle}>Curious about your friends' vibes?</h3>
              <p className={styles.inviteSubtitle}>Send them the quiz to see your compatibility.</p>
            </div>
          </div>
          <button
            className={`btn-primary ${styles.inviteBtn}`}
            onClick={async () => {
              try {
                await copyInviteLink();
                showToast('Invite link copied!', 'success');
              } catch {
                showToast('Failed to copy link', 'error');
              }
            }}
          >
            <i className="fas fa-share-alt"></i> Share Quiz Link
          </button>
        </div>

        {/* ── Quick nav cards ──────────────────── */}
        <div className={styles.navCards}>
          <Link to="/discover" className={`card ${styles.navCard}`}>
            <span className={styles.navCardEmoji}>🔍</span>
            <h3 className={styles.navCardTitle}>Discover people</h3>
            <p className={styles.navCardDesc}>
              Connect with people who share your vibe
            </p>
          </Link>
          <Link to="/events" className={`card ${styles.navCard}`}>
            <span className={styles.navCardEmoji}>🎟️</span>
            <h3 className={styles.navCardTitle}>Browse events</h3>
            <p className={styles.navCardDesc}>
              Find local meetups, hangouts, and events
            </p>
          </Link>
        </div>

        {/* ── Demo banner ───────────────────────── */}
        {demoActive && (
          <div className={styles.demoBanner}>
            <span>🎬 Demo Mode — showing sample data</span>
            <button className={styles.demoBannerDismiss} onClick={() => setDemoActive(false)} aria-label="Exit demo mode">
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        {/* ── Confirmed matches ────────────────── */}
        <div className={styles.matchesSection}>
          {displayMatches.length > 0 ? (
            <>
              <div className={styles.sectionHeadingRow}>
                <h2 className={styles.sectionHeading}>
                  💬 Your matches
                </h2>
                <Link to="/discover" className={styles.sectionLink}>
                  Browse matches →
                </Link>
              </div>

              <div className={styles.matchesStrip}>
                {displayMatches.map(m => (
                  <Link key={m.id} to={`/messages?with=${m.buddyId}`} className={styles.matchCard} aria-label={`Chat with ${m.buddyName}, ${m.buddyArchetype}`}>
                    <div className={styles.matchAvatar} aria-hidden="true">
                      {m.buddyName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <h4 className={styles.matchName}>{m.buddyName}</h4>
                    <p className={styles.matchArchetype}>{m.buddyArchetype}</p>
                    <span className={styles.matchBadge}>
                      Chat now
                    </span>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              image="https://d8j0ntlcm91z4.cloudfront.net/user_3F8g8wgqGblsT9ojkykW6TOorbT/hf_20260619_154708_5b9d1342-bd64-412d-8aa7-5032c79e6283.png"
              title="No confirmed matches yet"
              body="Browse Discover, send a match request, and when they accept — you'll see them here."
              action={{ label: 'Discover people', href: '/discover' }}
            />
          )}
        </div>

        {/* ── Feed ─────────────────────────────── */}
        <div className={styles.feedSection}>
          <h2 className={styles.sectionHeading}>
            What's happening
          </h2>

          {/* Post composer */}
          <div className={`card ${styles.postComposer}`}>
            <label htmlFor="post-composer" className="sr-only">Write a post</label>
            <textarea
              id="post-composer"
              ref={postContentRef}
              placeholder="What's on your mind?"
              rows={3}
              aria-label="Write a post"
            />
            <div className={styles.postComposerActions}>
              <button className={`btn-primary ${styles.postBtn}`} onClick={handlePublishPost}>
                <i className="fas fa-paper-plane"></i> Post
              </button>
            </div>
          </div>

          {/* Posts */}
          {displayPosts.length === 0 ? (
            <EmptyState
              image="https://d8j0ntlcm91z4.cloudfront.net/user_3F8g8wgqGblsT9ojkykW6TOorbT/hf_20260619_154708_5b9d1342-bd64-412d-8aa7-5032c79e6283.png"
              title="Nothing here yet"
              body="Be the first to share something with the community."
            />
          ) : (
            displayPosts.map(post => (
              <div key={post.id} className={`card ${styles.postCard}`}>
                {/* Author row */}
                {post.author?.name && (
                  <div className={styles.postAuthorRow}>
                    <div className={styles.postAuthorAvatar}>
                      {post.author.name[0]?.toUpperCase()}
                    </div>
                    <span className={styles.postAuthorName}>{post.author.name}</span>
                  </div>
                )}

                <p className={styles.postContent}>{post.content}</p>

                {/* Actions row */}
                <div className={styles.postActionsRow}>
                  <span className={styles.postDate}>
                    {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <div className={styles.postActions}>
                    <button
                      className={`btn-secondary ${styles.postActionBtn}`}
                      onClick={() => handleLike(post.id)}
                      aria-label={`Like post by ${post.author?.name || 'unknown'}`}
                    >
                      ❤️ {postLikes[post.id] || post.likesCount || post.likes || 0}
                    </button>
                    </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
