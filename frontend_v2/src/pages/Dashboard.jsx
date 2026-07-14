import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import { showToast } from '../utils/toast';
import EmptyState from '../components/ui/EmptyState';
import Navbar from '../components/ui/Navbar';
import { copyInviteLink } from '../utils/share';
import styles from '../styles/dashboard.module.css';

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
  const postContentRef = useRef(null);

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

        {/* ── Confirmed matches ────────────────── */}
        <div className={styles.matchesSection}>
          {confirmedMatches.length > 0 ? (
            <>
              <div className={styles.sectionHeadingRow}>
                <h2 className={styles.sectionHeading}>
                  💬 Your matches
                </h2>
                <Link to="/matches" className={styles.sectionLink}>
                  View all →
                </Link>
              </div>

              <div className={styles.matchesStrip}>
                {confirmedMatches.map(m => (
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
          {posts.length === 0 ? (
            <EmptyState
              image="https://d8j0ntlcm91z4.cloudfront.net/user_3F8g8wgqGblsT9ojkykW6TOorbT/hf_20260619_154708_5b9d1342-bd64-412d-8aa7-5032c79e6283.png"
              title="Nothing here yet"
              body="Be the first to share something with the community."
            />
          ) : (
            posts.map(post => (
              <div key={post.id} className={`card ${styles.postCard}`}>
                {post.author?.name && (
                  <div className={styles.postAuthorRow}>
                    <div className={styles.postAuthorAvatar}>
                      {post.author.name[0]?.toUpperCase()}
                    </div>
                    <span className={styles.postAuthorName}>{post.author.name}</span>
                  </div>
                )}

                <p className={styles.postContent}>{post.content}</p>

                <div className={styles.postActionsRow}>
                  <span className={styles.postDate}>
                    {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
