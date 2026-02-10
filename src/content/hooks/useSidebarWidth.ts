import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'chatlog-sidebar-width';
const DEFAULT_WIDTH = 320;
const MIN_WIDTH = 200;
const MAX_WIDTH_VW = 60;

export function useSidebarWidth() {
  const [width, setWidthState] = useState(DEFAULT_WIDTH);

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const stored = result[STORAGE_KEY];
      if (typeof stored === 'number' && stored >= MIN_WIDTH) {
        setWidthState(stored);
      }
    });
  }, []);

  // Sync CSS variable on host page for margin adjustment
  useEffect(() => {
    document.documentElement.style.setProperty('--chatlog-sidebar-width', `${width}px`);
  }, [width]);

  const setWidth = useCallback((w: number) => {
    const maxPx = window.innerWidth * MAX_WIDTH_VW / 100;
    const clamped = Math.max(MIN_WIDTH, Math.min(w, maxPx));
    setWidthState(clamped);
    chrome.storage.local.set({ [STORAGE_KEY]: clamped });
  }, []);

  return { width, setWidth, minWidth: MIN_WIDTH, maxWidthVw: MAX_WIDTH_VW };
}
