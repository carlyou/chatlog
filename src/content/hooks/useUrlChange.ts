import { useEffect, useRef } from 'react';

const POLL_INTERVAL_MS = 500;

export function useUrlChange(
  onUrlChange: () => void,
  onImmediate?: () => void,
) {
  const currentUrl = useRef(window.location.href);
  const pendingRef = useRef<number>(0);

  // Store callbacks in refs so the effect never re-runs and never
  // accidentally cancels a pending timeout due to dependency changes.
  const onUrlChangeRef = useRef(onUrlChange);
  const onImmediateRef = useRef(onImmediate);
  onUrlChangeRef.current = onUrlChange;
  onImmediateRef.current = onImmediate;

  useEffect(() => {
    const handleUrlChange = () => {
      if (window.location.href !== currentUrl.current) {
        currentUrl.current = window.location.href;
        onImmediateRef.current?.();
        // Avoid scheduling duplicate callbacks
        if (pendingRef.current) window.clearTimeout(pendingRef.current);
        pendingRef.current = window.setTimeout(() => {
          pendingRef.current = 0;
          onUrlChangeRef.current();
        }, 1000);
      }
    };

    // popstate fires on back/forward navigation
    window.addEventListener('popstate', handleUrlChange);

    // Poll for URL changes — history.pushState/replaceState patches don't
    // work across the content-script isolated world boundary, so SPA
    // navigations (clicking a different chat) are only detectable by polling.
    const pollId = window.setInterval(handleUrlChange, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.clearInterval(pollId);
      if (pendingRef.current) window.clearTimeout(pendingRef.current);
      pendingRef.current = 0;
    };
  }, []);
}
