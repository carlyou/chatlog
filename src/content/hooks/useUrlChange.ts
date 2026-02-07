import { useEffect, useRef } from 'react';

export function useUrlChange(onUrlChange: () => void) {
  const currentUrl = useRef(window.location.href);

  useEffect(() => {
    const handleUrlChange = () => {
      if (window.location.href !== currentUrl.current) {
        currentUrl.current = window.location.href;
        setTimeout(onUrlChange, 1000);
      }
    };

    window.addEventListener('popstate', handleUrlChange);

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      handleUrlChange();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      handleUrlChange();
    };

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [onUrlChange]);
}
