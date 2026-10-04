import { useState, useEffect, useCallback, useRef } from 'react';

export default function UpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const dismissedRef = useRef(false);

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
      if (remoteBuild && initBuild && remoteBuild !== initBuild) {
        setShowBanner(true);
      }
    } catch {
      // ignore silently
    }
  }, [initBuild]);

  const handleSwUpdated = useCallback(async () => {
    if (dismissedRef.current) return;
    try {
      const res = await fetch('/version.json', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const remoteBuild = data.build || 0;
      if (remoteBuild && initBuild && remoteBuild !== initBuild) {
        setShowBanner(true);
      }
    } catch {
      // ignore
    }
  }, [initBuild]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('sw-updated', handleSwUpdated);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('sw-updated', handleSwUpdated);
    };
  }, [checkForUpdate, handleSwUpdated]);

  const handleReload = () => {
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
      background: 'linear-gradient(135deg, #c2410c, #f43f5e)',
      color: '#fff', padding: '10px 16px', display: 'flex',
      alignItems: 'center', justifyContent: 'center', gap: 12,
      fontSize: '0.85rem', fontWeight: 600, boxShadow: '0 2px 12px rgba(194,65,12,0.3)',
    }}>
      <span>🚀 New version available</span>
      <button
        onClick={handleReload}
        aria-label="Reload page to apply update"
        style={{
          background: '#fff', color: '#c2410c', border: 'none', borderRadius: 6,
          padding: '5px 14px', fontSize: '0.82rem', fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Reload now
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss update banner"
        style={{
          background: 'none', color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: '1.1rem', padding: '2px 6px', opacity: 0.8,
        }}
      >
        ×
      </button>
    </div>
  );
}
