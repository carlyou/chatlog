import { useState, useEffect, useCallback } from 'react';
import type { Platform } from '../../types';

const STORAGE_KEY = 'chatlog-bookmarks';

function getConversationId(): string | null {
  const path = window.location.pathname;
  // Claude: /chat/{id}
  const claudeMatch = path.match(/\/chat\/([^/]+)/);
  if (claudeMatch) return claudeMatch[1];
  // ChatGPT: /c/{id}
  const gptMatch = path.match(/\/c\/([^/]+)/);
  if (gptMatch) return gptMatch[1];
  return null;
}

function makeKey(platform: Platform, conversationId: string, messageId: string): string {
  return `${platform}:${conversationId}:${messageId}`;
}

export function useBookmarks(platform: Platform) {
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [showOnly, setShowOnly] = useState(false);
  const conversationId = getConversationId();

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const stored = result[STORAGE_KEY];
      if (stored && Array.isArray(stored)) {
        setBookmarks(new Set(stored));
      }
    });
  }, []);

  const persist = useCallback((next: Set<string>) => {
    chrome.storage.local.set({ [STORAGE_KEY]: [...next] });
  }, []);

  const toggle = useCallback((messageId: string) => {
    if (!platform || !conversationId) return;
    const key = makeKey(platform, conversationId, messageId);
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      persist(next);
      return next;
    });
  }, [platform, conversationId, persist]);

  const isBookmarked = useCallback((messageId: string) => {
    if (!platform || !conversationId) return false;
    return bookmarks.has(makeKey(platform, conversationId, messageId));
  }, [platform, conversationId, bookmarks]);

  const toggleShowOnly = useCallback(() => setShowOnly((p) => !p), []);

  return { isBookmarked, toggle, showOnly, toggleShowOnly };
}
