import { useCallback, useEffect, useState } from 'react';
import type { Platform } from '../../types';
import { readPlatformPref, writePlatformPref } from '../lib/platformStorage';

const STORAGE_KEY_BASE = 'chatlog-sidebar-width';
const DEFAULT_WIDTH = 320;
const MIN_WIDTH = 200;
const MAX_WIDTH_VW = 60;

export function useSidebarWidth(platform: Platform) {
  const [width, setWidthState] = useState(DEFAULT_WIDTH);

  useEffect(() => {
    readPlatformPref<number>(STORAGE_KEY_BASE, platform, (value) => {
      if (typeof value === 'number' && value >= MIN_WIDTH) {
        setWidthState(value);
      }
    });
  }, [platform]);

  // Sync CSS variable on host page for margin adjustment
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--chatlog-sidebar-width',
      `${width}px`,
    );
  }, [width]);

  const setWidth = useCallback(
    (w: number) => {
      const maxPx = (window.innerWidth * MAX_WIDTH_VW) / 100;
      const clamped = Math.max(MIN_WIDTH, Math.min(w, maxPx));
      setWidthState(clamped);
      writePlatformPref(STORAGE_KEY_BASE, platform, clamped);
    },
    [platform],
  );

  return { width, setWidth, minWidth: MIN_WIDTH, maxWidthVw: MAX_WIDTH_VW };
}
