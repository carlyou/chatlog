import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Message, Platform } from '../../types';
import { getAdapter } from '../lib/adapters/registry';
import {
  clearMainHighlights,
  countMainHighlights,
  getMainHighlightAt,
  highlightMainConversation,
  setCurrentMainHighlight,
} from '../lib/highlighter';
import type { ActiveTarget } from './useActiveMessage';

export function useSearch(
  messages: Message[],
  platform: Platform,
  lockActive?: (target: ActiveTarget) => void,
) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [mainMatchCount, setMainMatchCount] = useState(0);
  const [currentMatchMsgId, setCurrentMatchMsgId] = useState<string | null>(
    null,
  );
  const containerRef = useRef<Element | null>(null);

  // Resolve the main-page container once
  const getContainer = useCallback((): Element | null => {
    if (containerRef.current?.isConnected) return containerRef.current;
    if (!platform) return null;
    const adapter = getAdapter(platform);
    if (!adapter) return null;
    containerRef.current = document.querySelector(
      adapter.selectors.messageContainer,
    );
    return containerRef.current;
  }, [platform]);

  // Message-level match IDs (for sidebar filtering / dimming)
  const matchIds = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return messages
      .filter((msg) => {
        if (msg.text.toLowerCase().includes(q)) return true;
        if (msg.structured) {
          for (const block of msg.structured.blocks) {
            if (
              block.type === 'heading' &&
              block.text.toLowerCase().includes(q)
            )
              return true;
            if (block.type === 'code' && block.text.toLowerCase().includes(q))
              return true;
            if (block.type === 'paragraph') {
              const text = block.segments.map((s) => s.text).join('');
              if (text.toLowerCase().includes(q)) return true;
            }
            if (block.type === 'list') {
              for (const item of block.items) {
                const text = item.map((s) => s.text).join('');
                if (text.toLowerCase().includes(q)) return true;
              }
            }
            if (block.type === 'table') {
              for (const h of block.headers) {
                if (h.toLowerCase().includes(q)) return true;
              }
              for (const row of block.rows) {
                for (const cell of row) {
                  if (cell.toLowerCase().includes(q)) return true;
                }
              }
            }
          }
        }
        return false;
      })
      .map((msg) => msg.id);
  }, [messages, query]);

  // Find which message contains a given DOM element
  const findMessageForElement = useCallback(
    (el: HTMLElement): string | null => {
      for (const msg of messages) {
        if (msg.element && (msg.element as HTMLElement).contains(el)) {
          return msg.id;
        }
      }
      return null;
    },
    [messages],
  );

  // Apply / clear main-conversation highlights whenever query or open state changes
  useEffect(() => {
    const container = getContainer();
    if (isOpen && query.trim()) {
      highlightMainConversation(container, query);
      const count = countMainHighlights(container);
      setMainMatchCount(count);
      // Reset to first match and find its message
      setCurrentMatch(0);
      if (count > 0) {
        setCurrentMainHighlight(container, 0);
        const mark = getMainHighlightAt(container, 0);
        setCurrentMatchMsgId(mark ? findMessageForElement(mark) : null);
      } else {
        setCurrentMatchMsgId(null);
      }
    } else {
      clearMainHighlights(container);
      setMainMatchCount(0);
      setCurrentMatchMsgId(null);
    }
    return () => {
      clearMainHighlights(container);
    };
  }, [isOpen, query, getContainer, findMessageForElement]);

  // Update current-match highlight in main conversation when currentMatch changes
  // (skip when triggered by the query effect above which handles its own highlighting)
  const skipNextHighlightRef = useRef(false);
  useEffect(() => {
    if (!isOpen) return;
    if (skipNextHighlightRef.current) {
      skipNextHighlightRef.current = false;
      return;
    }
    const container = getContainer();
    setCurrentMainHighlight(container, currentMatch);
    const mark = getMainHighlightAt(container, currentMatch);
    const msgId = mark ? findMessageForElement(mark) : null;
    setCurrentMatchMsgId(msgId);
    if (msgId && lockActive) {
      lockActive({ messageId: msgId, sectionIndex: null });
    }
  }, [currentMatch, isOpen, getContainer, findMessageForElement, lockActive]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setCurrentMatch(0);
    setCurrentMatchMsgId(null);
  }, []);
  const toggle = useCallback(() => {
    if (isOpen) close();
    else open();
  }, [isOpen, open, close]);

  const nextMatch = useCallback(() => {
    if (mainMatchCount === 0) return;
    setCurrentMatch((prev) => (prev + 1) % mainMatchCount);
  }, [mainMatchCount]);

  const prevMatch = useCallback(() => {
    if (mainMatchCount === 0) return;
    setCurrentMatch((prev) => (prev - 1 + mainMatchCount) % mainMatchCount);
  }, [mainMatchCount]);

  const updateQuery = useCallback((q: string) => {
    setQuery(q);
    skipNextHighlightRef.current = true;
    setCurrentMatch(0);
  }, []);

  return {
    query,
    isOpen,
    currentMatch,
    matchIds,
    currentMatchMsgId,
    totalMatches: mainMatchCount,
    mainMatchCount,
    open,
    close,
    toggle,
    nextMatch,
    prevMatch,
    setQuery: updateQuery,
  };
}
