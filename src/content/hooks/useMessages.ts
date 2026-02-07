import { useState, useEffect, useCallback } from 'react';
import type { Message, Platform } from '../../types';
import { parseMessages } from '../lib/parsers';
import { getSelectors } from '../lib/selectors';
import { useUrlChange } from './useUrlChange';

export function useMessages(platform: Platform) {
  const [messages, setMessages] = useState<Message[]>([]);

  const refresh = useCallback(() => {
    setMessages(parseMessages(platform));
  }, [platform]);

  // Initial parse + MutationObserver for live updates
  useEffect(() => {
    refresh();

    const selectors = getSelectors(platform);
    if (!selectors) return;

    const container = document.querySelector(selectors.messageContainer);
    if (!container) return;

    let timeout: ReturnType<typeof setTimeout>;

    const observer = new MutationObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(refresh, 500);
    });

    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [platform, refresh]);

  // Re-parse on SPA navigation
  useUrlChange(refresh);

  return messages;
}
