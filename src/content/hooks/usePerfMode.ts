import { useCallback, useEffect, useState } from 'react';
import { perfIsEnabled, perfSetEnabled } from '../lib/perf';

const STORAGE_KEY = 'chatlog-perf-enabled';

export function usePerfMode() {
  const [enabled, setEnabledState] = useState<boolean>(perfIsEnabled());

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const stored = result[STORAGE_KEY];
      if (typeof stored === 'boolean') {
        setEnabledState(stored);
        perfSetEnabled(stored);
      }
    });
  }, []);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    chrome.storage.local.set({ [STORAGE_KEY]: next });
    perfSetEnabled(next);
  }, []);

  return { enabled, setEnabled };
}
