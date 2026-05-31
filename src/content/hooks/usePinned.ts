import { useEffect, useState } from 'react';
import type { Platform } from '../../types';
import { readPlatformPref, writePlatformPref } from '../lib/platformStorage';

const STORAGE_KEY_BASE = 'chatlog-pinned';

export function usePinned(platform: Platform) {
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    readPlatformPref<boolean>(STORAGE_KEY_BASE, platform, (value) => {
      if (typeof value === 'boolean') setPinned(value);
    });
  }, [platform]);

  useEffect(() => {
    if (pinned) {
      document.body.classList.add('chatlog-right-pinned');
    } else {
      document.body.classList.remove('chatlog-right-pinned');
    }
  }, [pinned]);

  const toggle = () => {
    setPinned((p) => {
      const next = !p;
      writePlatformPref(STORAGE_KEY_BASE, platform, next);
      return next;
    });
  };

  return { pinned, toggle };
}
