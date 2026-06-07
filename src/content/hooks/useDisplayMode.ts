import { useEffect, useState } from 'react';
import type { DisplayMode, Platform } from '../../types';
import { readPlatformPref, writePlatformPref } from '../lib/platformStorage';

const STORAGE_KEY_BASE = 'chatlog-display-mode';

export function useDisplayMode(platform: Platform) {
  const [mode, setModeState] = useState<DisplayMode>('compact');

  useEffect(() => {
    readPlatformPref<DisplayMode>(STORAGE_KEY_BASE, platform, (value) => {
      if (value === 'compact' || value === 'outline' || value === 'detailed') {
        setModeState(value);
      }
    });
  }, [platform]);

  const setMode = (newMode: DisplayMode) => {
    setModeState(newMode);
    writePlatformPref(STORAGE_KEY_BASE, platform, newMode);
  };

  return { mode, setMode };
}
