import { useState, useEffect, useCallback } from 'react';

/**
 * Lightweight update detection banner.
 *
 * On each visibility change (user switches back to tab), fetches /version.json.
 * If the build timestamp differs from the one at initial load, shows a banner
 * offering to reload. No polling — only checks on tab focus.
 */
export default function UpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);

  const initBuild = (() => {
    try {
      const meta = document.querySelector('meta[name="hb-build"]');
      return meta ? parseInt(meta.content, 10) : 0;
    } catch {
      return 0;
    }
  })();

  const checkForUpdate = useCallback(async () => {
    try {
      const res = await fetch('/version.json', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const remoteBuild = data.build || 0;
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
    // Also show immediately if a new service worker just activated
    const handleSwUpdated = () => setShowBanner(true);

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('sw-updated', handleSwUpdated);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('sw-updated', handleSwUpdated);
    };
  }, [checkForUpdate]);

  const handleReload = () => {
    // Unregister old service worker, then reload
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        Promise.all(regs.map((r) => r.unregister())).then(() => {
          window.location.reload();
        });
      });
    } else {
      window.location.reload();
    }
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
        onClick={() => setShowBanner(false)}
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
