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
  const { token, authFetch } = useAuth();
  const navigate = useNavigate();
  const [confirmedMatches, setConfirmedMatches] = useState([]);
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState(false);
  const [openCommentsId, setOpenCommentsId] = useState(null);
  const [comments, setComments] = useState({}); // postId -> { items, loading, error, posting, postError }
  const [likingIds, setLikingIds] = useState(() => new Set());
  const [userName, setUserName] = useState('');
  const [userArchetype, setUserArchetype] = useState('');
  const postContentRef = useRef(null);
  const PAGE_SIZE = 10;

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
    }
  };

  const loadFeed = async () => {
    setFeedLoading(true);
    setFeedError(false);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/posts?limit=${PAGE_SIZE}&offset=0`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(data.posts || []);
      setHasMore(data.hasMore || false);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setFeedError(true);
    } finally {
      setFeedLoading(false);
    }
  };

  const loadMorePosts = async () => {
    setFeedLoadingMore(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/posts?limit=${PAGE_SIZE}&offset=${posts.length}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(prev => [...prev, ...(data.posts || [])]);
      setHasMore(data.hasMore || false);
    } catch (err) {
      console.error('Failed to load more posts:', err);
      showToast('Could not load more posts', 'error');
    } finally {
      setFeedLoadingMore(false);
    }
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

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchCurrentUser();
    loadFeed();
    fetchConfirmedMatches();
  }, [token, navigate]);

  const handlePublishPost = async () => {
    const content = postContentRef.current?.value?.trim();
    if (!content) { showToast('Write something first!', 'error'); return; }
    try {
      const res = await authFetch(`${API_BASE_URL}/api/posts`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const newPost = await res.json();
        postContentRef.current.value = '';
        setPosts(prev => [newPost, ...prev]);
        showToast('Post published!', 'success');
      } else {
        showToast('Failed to publish', 'error');
      }
    } catch {
      showToast('Failed to publish', 'error');
    }
  };

  const toggleLike = async (post) => {
    setLikingIds(prev => new Set(prev).add(post.id));
    try {
      const res = await authFetch(`${API_BASE_URL}/api/posts/${post.id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p =>
          p.id === post.id ? { ...p, likesCount: data.likesCount, viewerHasLiked: data.viewerHasLiked } : p));
      } else {
        showToast('Could not update like', 'error');
      }
    } catch {
      showToast('Could not update like', 'error');
    } finally {
      setLikingIds(prev => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    }
  };

  const toggleComments = (post) => {
    if (openCommentsId === post.id) {
      setOpenCommentsId(null);
      return;
    }
    setOpenCommentsId(post.id);
    if (!comments[post.id]) loadComments(post.id);
  };

  const loadComments = async (postId) => {
    setComments(prev => ({
      ...prev,
      [postId]: { items: [], loading: true, error: false, posting: false, postError: null },
    }));
    try {
      const res = await authFetch(`${API_BASE_URL}/api/posts/${postId}/comments`);
      if (!res.ok) throw new Error();
      const items = await res.json();
      setComments(prev => ({
        ...prev,
        [postId]: { items, loading: false, error: false, posting: false, postError: null },
      }));
    } catch (err) {
      console.error('Failed to load comments:', err);
      setComments(prev => ({
        ...prev,
        [postId]: { ...(prev[postId] || { items: [] }), loading: false, error: true },
      }));
    }
  };

  const submitComment = async (postId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setComments(prev => ({
      ...prev,
      [postId]: { ...(prev[postId] || { items: [] }), posting: true, postError: null },
    }));
    try {
      const res = await authFetch(`${API_BASE_URL}/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: trimmed }),
      });
      if (res.ok) {
        const c = await res.json();
        setComments(prev => {
          const cur = prev[postId] || { items: [] };
          return { ...prev, [postId]: { ...cur, items: [...cur.items, c], posting: false, postError: null } };
        });
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
      } else {
        throw new Error();
      }
    } catch {
      setComments(prev => ({
        ...prev,
        [postId]: { ...(prev[postId] || { items: [] }), posting: false, postError: 'Failed to post comment' },
      }));
    }
  };

  if (feedLoading) {
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
          {feedError ? (
            <div className={styles.feedError}>
              <p>We couldn't load the community feed.</p>
              <button className={styles.loadMoreBtn} onClick={loadFeed}>Try again</button>
            </div>
          ) : posts.length === 0 ? (
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
                    <div className={styles.postAuthorAvatar} aria-hidden="true">
                      {post.author.name[0]?.toUpperCase()}
                    </div>
                    <span className={styles.postAuthorName}>{post.author.name}</span>
                    {post.author.archetype && (
                      <span className={styles.postAuthorTag}>{post.author.archetype}</span>
                    )}
                  </div>
                )}

                <p className={styles.postContent}>{post.content}</p>

                <div className={styles.postActionsRow}>
                  <span className={styles.postDate}>
                    {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>

                  <div className={styles.postActions}>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${post.viewerHasLiked ? styles.actionBtnActive : ''}`}
                      onClick={() => toggleLike(post)}
                      disabled={likingIds.has(post.id)}
                      aria-pressed={post.viewerHasLiked}
                      aria-label={post.viewerHasLiked ? 'Unlike this post' : 'Like this post'}
                    >
                      <i className={`${post.viewerHasLiked ? 'fas' : 'far'} fa-heart`} aria-hidden="true" />
                      <span>{post.likesCount || 0}</span>
                    </button>

                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => toggleComments(post)}
                      aria-expanded={openCommentsId === post.id}
                    >
                      <i className="far fa-comment" aria-hidden="true" />
                      <span>{post.commentsCount || 0}</span>
                    </button>
                  </div>
                </div>

                {openCommentsId === post.id && (
                  <CommentSection
                    state={comments[post.id]}
                    onRetry={() => loadComments(post.id)}
                    onSubmit={(text) => submitComment(post.id, text)}
                  />
                )}
              </div>
            ))
          )}

          {hasMore && !feedError && (
            <div className={styles.loadMoreWrap}>
              <button
                className={styles.loadMoreBtn}
                onClick={loadMorePosts}
                disabled={feedLoadingMore}
              >
                {feedLoadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/** Comments drawer for a single post: list + composer, with loading/error states. */
function CommentSection({ state, onRetry, onSubmit }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || state?.posting) return;
    onSubmit(text);
    setText('');
  };

  return (
    <div className={styles.commentSection}>
      {state?.loading ? (
        <div className={styles.commentLoading}><div className={styles.loadingSpinner} /></div>
      ) : state?.error ? (
        <div className={styles.commentError}>
          <p>Couldn't load comments.</p>
          <button className={styles.commentRetry} onClick={onRetry}>Try again</button>
        </div>
      ) : (
        <>
          {state?.items?.length > 0 ? (
            <ul className={styles.commentList}>
              {state.items.map(c => (
                <li key={c.id} className={styles.commentItem}>
                  <div className={styles.commentAvatar} aria-hidden="true">
                    {c.authorName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className={styles.commentBody}>
                    <div className={styles.commentMeta}>
                      <span className={styles.commentAuthor}>{c.authorName}</span>
                      {c.authorArchetype && (
                        <span className={styles.commentTag}>{c.authorArchetype}</span>
                      )}
                    </div>
                    <p className={styles.commentText}>{c.content}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.commentEmpty}>No comments yet — start the conversation.</p>
          )}

          <form className={styles.commentComposer} onSubmit={handleSubmit}>
            <input
              className={styles.commentInput}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment…"
              aria-label="Write a comment"
              disabled={state?.posting}
            />
            <button
              type="submit"
              className={styles.commentSubmit}
              disabled={!text.trim() || state?.posting}
            >
              {state?.posting ? 'Posting…' : 'Send'}
            </button>
          </form>
          {state?.postError && <p className={styles.commentPostError}>{state.postError}</p>}
        </>
      )}
    </div>
  );
}
