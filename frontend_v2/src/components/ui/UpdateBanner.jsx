import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Lightweight update detection banner.
 *
 * Checks /version.json on tab focus. If the build timestamp differs from the
 * one embedded in the current page, shows a banner offering to reload.
 *
 * Dismissal is session-scoped — once dismissed, won't re-show until next
 * full navigation. This prevents the banner from appearing on every tab switch
 * when the user has already acknowledged it.
 */
export default function UpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const dismissedRef = useRef(false);

  // Read the build timestamp injected by Vite into the HTML
  const initBuild = (() => {
    try {
      const meta = document.querySelector('meta[name="hb-build"]');
      return meta ? parseInt(meta.content, 10) : 0;
    } catch {
      return 0;
    }
  })();

  const checkForUpdate = useCallback(async () => {
    if (dismissedRef.current) return;
    try {
      const res = await fetch('/version.json', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const remoteBuild = data.build || 0;
      // Only show if we have a valid local build AND it differs from remote
      if (remoteBuild && initBuild && remoteBuild !== initBuild) {
        setShowBanner(true);
      }
    } catch {
      // Network error — ignore silently
    }
  }, [initBuild]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };
    const handleSwUpdated = () => {
      if (!dismissedRef.current) setShowBanner(true);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('sw-updated', handleSwUpdated);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('sw-updated', handleSwUpdated);
    };
  }, [checkForUpdate]);

  const handleReload = () => {
    // Clear the dismissed flag so next load can detect future updates
    dismissedRef.current = false;
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowBanner(false);
    dismissedRef.current = true;
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: '#fff', padding: '10px 16px', display: 'flex',
      alignItems: 'center', justifyContent: 'center', gap: 12,
      fontSize: '0.85rem', fontWeight: 600, boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
    }}>
      <span>🚀 New version available</span>
      <button
        onClick={handleReload}
        style={{
          background: '#fff', color: '#6366f1', border: 'none', borderRadius: 6,
          padding: '5px 14px', fontSize: '0.82rem', fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Reload now
      </button>
      <button
        onClick={handleDismiss}
        style={{
          background: 'none', color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: '1.1rem', padding: '2px 6px', opacity: 0.8,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
