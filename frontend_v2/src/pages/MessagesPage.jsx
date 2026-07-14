import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, WS_BASE_URL } from '../utils/constants';
import { showToast } from '../utils/toast';
import EmptyState from '../components/ui/EmptyState';
import Navbar from '../components/ui/Navbar';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * MessagesPage — inbox + chat view for confirmed matches.
 *
 * Route: /messages            -> inbox (conversation list)
 *        /messages?with=<id>   -> thread with that partner
 *
 * Conversations are loaded via GET /api/messages/conversations.
 * A thread is loaded via REST (GET /api/messages/{user1}/{user2}), then
 * upgraded to WebSocket/STOMP for real-time incoming messages.
 * Sending prefers STOMP publish (/app/chat.send) when the WS connection
 * is active, falling back to REST (POST /api/messages).
 *
 * Both REST and WS enforce a CONFIRMED match server-side; without one the
 * backend returns 403 and the UI shows the unauthorized state.
 */
export default function MessagesPage() {
  const { token, authFetch } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [buddyId, setBuddyId] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Inbox state
  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(true);
  const [convError, setConvError] = useState(null);

  const wsClientRef = useRef(null);
  const messagesEndRef = useRef(null);
  const msgListRef = useRef(null);
  const userIdRef = useRef(null);

  // ── Scroll helper: only auto-scroll if user is near the bottom ──
  const scrollToBottom = useCallback((force = false) => {
    const el = msgListRef.current;
    if (!el) return;
    if (force || el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, []);

  // ── Load inbox ──
  const loadConversations = useCallback(async () => {
    setConvLoading(true);
    setConvError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/messages/conversations`);
      if (res.ok) {
        setConversations(await res.json());
      } else {
        setConvError('load_failed');
      }
    } catch {
      setConvError('load_failed');
    } finally {
      setConvLoading(false);
    }
  }, [authFetch]);

  // ── Auth guard + initial ?with= param ──
  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const storedId = localStorage.getItem('userId');
    userIdRef.current = storedId;
    loadConversations();
    const params = new URLSearchParams(window.location.search);
    const withId = params.get('with');
    if (withId) {
      setBuddyId(withId);
      loadConversation(withId);
    } else {
      setLoading(false);
    }
    return () => {
      if (wsClientRef.current) {
        try { wsClientRef.current.deactivate(); } catch { /* ignore */ }
        wsClientRef.current = null;
      }
    };
  }, [token, navigate, loadConversations]);

  // ── Load conversation via REST, then connect WebSocket ──
  const loadConversation = async (id) => {
    setBuddyId(id);
    setLoading(true);
    setError(null);
    setUnauthorized(false);
    try {
      const userId = userIdRef.current;
      if (!userId) { navigate('/login'); return; }
      const res = await authFetch(`${API_BASE_URL}/api/messages/${userId}/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      } else if (res.status === 403) {
        setUnauthorized(true);
        setError('You can only message people you’re matched with.');
      } else {
        setError('Failed to load conversation');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    connectWebSocket();
  };

  // ── Scroll when messages change ──
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  const openConversation = (partnerId) => {
    navigate(`/messages?with=${partnerId}`);
    loadConversation(String(partnerId));
  };

  const backToInbox = () => {
    navigate('/messages');
    setBuddyId(null);
    setMessages([]);
    setError(null);
    setUnauthorized(false);
    setLoading(false);
    loadConversations();
  };

  // ── WebSocket/STOMP connection for real-time incoming messages ──
  const connectWebSocket = useCallback(() => {
    if (!token) return;
    const userId = userIdRef.current;
    if (!userId) return;
    if (wsClientRef.current?.connected) return;

    // The JWT is delivered as a `?token=` query parameter on the SockJS URL.
    // SockJS transports cannot set custom WebSocket headers, so the WS handshake
    // (WebSocketConfig.determineUser) reads the token from the URL to bind the
    // authenticated Principal to the whole session.
    const wsUrl = WS_BASE_URL
      ? `${WS_BASE_URL}/ws-chat?token=${encodeURIComponent(token)}`
      : `/ws-chat?token=${encodeURIComponent(token)}`;

    try {
      if (wsClientRef.current) {
        try { wsClientRef.current.deactivate(); } catch { /* ignore */ }
        wsClientRef.current = null;
      }

      const client = new Client({
        webSocketFactory: () => new SockJS(wsUrl),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => {
          setWsConnected(true);
          client.subscribe(`/topic/chat/${userId}`, (frame) => {
            try {
              const msg = JSON.parse(frame.body);
              setMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev;
                const next = [...prev, msg];
                next.sort((a, b) => {
                  const aId = typeof a.id === 'number' ? a.id : 0;
                  const bId = typeof b.id === 'number' ? b.id : 0;
                  return aId - bId;
                });
                return next;
              });
            } catch (e) { console.error('[WS] parse error:', e); }
          });
          wsClientRef.current = client;
        },
        onDisconnect: () => { setWsConnected(false); },
        onStompError: (e) => { console.error('[WS] STOMP error:', e); setWsConnected(false); },
        onWebSocketError: (e) => { console.error('[WS] WebSocket error:', e); setWsConnected(false); },
      });
      client.activate();
    } catch (e) {
      console.error('[WS] connect failed:', e);
    }
  }, [token]);

  // ── Send message — prefers STOMP when connected, falls back to REST ──
  const handleSend = async () => {
    if (!input.trim() || !buddyId) return;
    const content = input.trim();
    setInput('');
    const receiverId = parseInt(buddyId);
    const userId = parseInt(userIdRef.current);

    if (wsConnected && wsClientRef.current?.connected) {
      try {
        wsClientRef.current.publish({
          destination: '/app/chat.send',
          body: JSON.stringify({ receiverId, content }),
        });
        setMessages(prev => [...prev, {
          id: 'local-' + Date.now(),
          senderId: userId,
          receiverId,
          content,
          timestamp: new Date().toISOString(),
        }]);
        showToast('Message sent!', 'success');
        return;
      } catch (e) {
        console.error('[WS] publish failed, falling back to REST:', e);
      }
    }

    try {
      const res = await authFetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        body: JSON.stringify({ receiverId, content }),
      });
      if (res.ok) {
        const saved = await res.json();
        setMessages(prev => [...prev, saved]);
        showToast('Message sent!', 'success');
      } else if (res.status === 403) {
        setUnauthorized(true);
        showToast('You can only message people you’re matched with', 'error');
      } else {
        showToast('Failed to send message', 'error');
      }
    } catch {
      showToast('Failed to send message', 'error');
    }
  };

  if (!token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="spinner-border"></div>
      </div>
    );
  }

  const hasMessages = messages && messages.length > 0;
  const userId = userIdRef.current;

  return (
    <>
      <div className="bg-mesh">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <Navbar />

      <div style={{
        maxWidth: 680, margin: '0 auto', padding: '72px 16px 24px',
        display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 72px)',
      }}>

        {/* ══════════ INBOX (no ?with) ══════════ */}
        {!buddyId ? (
          <>
            <h1 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              💬 Messages
            </h1>
            <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              Your conversations with confirmed matches.
            </p>

            {convLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <div className="spinner-border"></div>
              </div>
            ) : convError ? (
              <EmptyState icon="⚠️" title="Couldn’t load messages" body="Please try again in a moment." action={{ label: 'Retry', onClick: loadConversations }} />
            ) : conversations.length === 0 ? (
              <EmptyState
                icon="💬"
                title="No conversations yet"
                body="When you connect with someone and they accept, you can message them here."
                action={{ label: 'Discover people', href: '/discover' }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {conversations.map(conv => {
                  const last = conv.lastMessage;
                  const preview = last?.content || '';
                  const time = last?.timestamp
                    ? new Date(last.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : '';
                  const isMe = last && String(last.senderId) === String(userId);
                  return (
                    <button
                      key={conv.partnerId}
                      onClick={() => openConversation(conv.partnerId)}
                      className="card"
                      aria-label={`Open conversation with ${conv.partnerName}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                        padding: 14, background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                        borderRadius: 14, cursor: 'pointer',
                      }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--color-accent-warm)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, flexShrink: 0 }}>
                        {conv.partnerName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {conv.partnerName}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>{time}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {preview ? `${isMe ? 'You: ' : ''}${preview}` : 'Start the conversation'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* ══════════ THREAD (?with) ══════════ */
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <button onClick={backToInbox} className="btn-secondary" aria-label="Back to messages" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                <i className="fas fa-arrow-left"></i>
              </button>
              <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', flex: 1 }}>
                Conversation
              </h1>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 600,
                color: wsConnected ? '#16a34a' : 'var(--color-text-muted)',
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: wsConnected ? '#16a34a' : '#d97706',
                  boxShadow: wsConnected ? '0 0 6px rgba(22,163,74,0.4)' : 'none', flexShrink: 0,
                }}></span>
                {wsConnected ? 'Connected' : 'Connecting…'}
              </span>
            </div>

            {unauthorized ? (
              <EmptyState
                icon="🔒"
                title="Can’t open this chat"
                body="You can only message people you’re matched with. Accept their request from Matches to start chatting."
                action={{ label: 'Go to Matches', href: '/matches' }}
              />
            ) : loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <div className="spinner-border"></div>
              </div>
            ) : error ? (
              <div style={{ color: 'var(--color-accent-warm)', fontSize: '0.85rem', textAlign: 'center', padding: 24 }}>
                {error}
              </div>
            ) : (
              <>
                <div
                  ref={msgListRef}
                  style={{
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    borderRadius: 16, padding: '14px 14px 10px', flex: 1, minHeight: 200,
                    overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12,
                  }}
                >
                  {hasMessages ? (
                    <>
                      {messages.map(msg => {
                        const isMe = String(msg.senderId) === String(userId);
                        return (
                          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                            <div style={{
                              fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 2, padding: '0 4px',
                            }}>
                              {isMe ? 'You' : (msg.senderName || `Match #${buddyId}`)}
                            </div>
                            <div style={{
                              maxWidth: '75%', padding: '10px 14px',
                              borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              background: isMe ? 'var(--color-accent-warm)' : '#f1f5f9',
                              color: isMe ? '#fff' : 'var(--color-text-main)',
                              fontSize: '0.88rem', lineHeight: 1.5, wordBreak: 'break-word',
                              boxShadow: isMe ? '0 2px 8px rgba(194,65,12,0.15)' : 'none',
                            }}>
                              {msg.content}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: 2, padding: '0 4px' }}>
                              {msg.timestamp
                                ? new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                : ''}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                      <div style={{ fontSize: '2rem', marginBottom: 8 }}>🌱</div>
                      <p style={{ margin: 0 }}>No messages yet. Say hello!</p>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '10px' }}>
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                    placeholder="Type a message…"
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text-main)', fontSize: '0.9rem', padding: '4px 8px' }}
                  />
                  <button className="btn-primary" onClick={handleSend} disabled={!input.trim()} style={{ padding: '8px 18px', fontSize: '0.82rem' }}>
                    <i className="fas fa-paper-plane"></i> Send
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
