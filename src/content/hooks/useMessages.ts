import { useState, useEffect, useCallback } from 'react';
import type { Message, Platform } from '../../types';
import { parseMessages } from '../lib/parsers';
import { getSelectors } from '../lib/selectors';
import { useUrlChange } from './useUrlChange';
import { perfInc, perfSetMax, perfTiming } from '../lib/perf';

export function useMessages(platform: Platform) {
  const [messages, setMessages] = useState<Message[]>([]);

  const refresh = useCallback(() => {
    const start = performance.now();
    perfInc('refreshExecuted');
    setMessages(parseMessages(platform));
    perfTiming('refreshMs', performance.now() - start);
  }, [platform]);

  // Initial parse + MutationObserver for live updates
  useEffect(() => {
    refresh();

    const selectors = getSelectors(platform);
    if (!selectors) return;

    const container = document.querySelector(selectors.messageContainer);
    if (!container) return;

    let timeout: ReturnType<typeof setTimeout>;

    const observer = new MutationObserver((records) => {
      perfInc('observerCallbacks');
      perfInc('mutationRecordsTotal', records.length);
      perfSetMax('mutationRecordsMaxBurst', records.length);
      if (timeout) perfInc('refreshSkipped');
      clearTimeout(timeout);
      perfInc('refreshScheduled');
      timeout = setTimeout(refresh, 500);
    });

    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [platform, refresh]);

  // Re-parse on SPA navigation
  useUrlChange(() => {
    perfInc('urlChangeRefreshes');
    refresh();
  });

  return messages;
}
