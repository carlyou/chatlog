import { useState, useEffect } from 'react';
import type { ShortcutConfig } from '../../types';

const STORAGE_KEY = 'chatlog-shortcuts';

export const DEFAULT_SHORTCUTS: ShortcutConfig = {
  toggleMode: { enabled: true, key: 'Tab', shift: true },
  toggleSidebar: { enabled: true, key: 'Escape', shift: true },
  toggleSearch: { enabled: true, key: ' ', shift: true },
  historyBack: { enabled: true, key: 'ArrowLeft', shift: true },
  historyForward: { enabled: true, key: 'ArrowRight', shift: true },
  sectionPrev: { enabled: true, key: 'ArrowUp', shift: true },
  sectionNext: { enabled: true, key: 'ArrowDown', shift: true },
};

/** Merge stored config with defaults so new keys added later are picked up. */
function mergeWithDefaults(stored: Partial<ShortcutConfig>): ShortcutConfig {
  const merged = { ...DEFAULT_SHORTCUTS };
  for (const key of Object.keys(DEFAULT_SHORTCUTS) as (keyof ShortcutConfig)[]) {
    if (stored[key]) {
      merged[key] = { ...DEFAULT_SHORTCUTS[key], ...stored[key] };
    }
  }
  return merged;
}

export function useShortcutConfig() {
  const [config, setConfigState] = useState<ShortcutConfig>(DEFAULT_SHORTCUTS);

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const stored = result[STORAGE_KEY];
      if (stored) {
        setConfigState(mergeWithDefaults(stored));
      }
    });
  }, []);

  const setConfig = (newConfig: ShortcutConfig) => {
    setConfigState(newConfig);
    chrome.storage.local.set({ [STORAGE_KEY]: newConfig });
  };

  return { config, setConfig };
}
