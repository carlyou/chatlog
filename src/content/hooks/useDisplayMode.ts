import { useState, useEffect } from 'react';
import type { DisplayMode } from '../../types';

const STORAGE_KEY = 'chatlog-display-mode';

export function useDisplayMode() {
  const [mode, setModeState] = useState<DisplayMode>('compact');

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const stored = result[STORAGE_KEY];
      if (stored === 'compact' || stored === 'detailed') {
        setModeState(stored);
      }
    });
  }, []);

  const setMode = (newMode: DisplayMode) => {
    setModeState(newMode);
    chrome.storage.local.set({ [STORAGE_KEY]: newMode });
  };

  return { mode, setMode };
}
