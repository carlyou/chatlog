import { useEffect, useState } from 'react';

const STORAGE_KEY = 'chatlog-pinned';

export function usePinned() {
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const stored = result[STORAGE_KEY];
      if (typeof stored === 'boolean') {
        setPinned(stored);
      }
    });
  }, []);

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
      chrome.storage.local.set({ [STORAGE_KEY]: next });
      return next;
    });
  };

  return { pinned, toggle };
}
