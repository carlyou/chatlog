import { useState, useMemo, useCallback } from 'react';
import type { Message } from '../../types';

export interface SearchState {
  query: string;
  isOpen: boolean;
  currentMatch: number;
  matchIds: string[];
  totalMatches: number;
}

export function useSearch(messages: Message[]) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(0);

  const matchIds = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return messages
      .filter((msg) => {
        if (msg.text.toLowerCase().includes(q)) return true;
        if (msg.structured) {
          for (const block of msg.structured.blocks) {
            if (block.type === 'heading' && block.text.toLowerCase().includes(q)) return true;
            if (block.type === 'code' && block.text.toLowerCase().includes(q)) return true;
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
          }
        }
        return false;
      })
      .map((msg) => msg.id);
  }, [messages, query]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setCurrentMatch(0);
  }, []);
  const toggle = useCallback(() => {
    if (isOpen) close();
    else open();
  }, [isOpen, open, close]);

  const nextMatch = useCallback(() => {
    if (matchIds.length === 0) return;
    setCurrentMatch((prev) => (prev + 1) % matchIds.length);
  }, [matchIds.length]);

  const prevMatch = useCallback(() => {
    if (matchIds.length === 0) return;
    setCurrentMatch((prev) => (prev - 1 + matchIds.length) % matchIds.length);
  }, [matchIds.length]);

  const updateQuery = useCallback((q: string) => {
    setQuery(q);
    setCurrentMatch(0);
  }, []);

  return {
    query,
    isOpen,
    currentMatch,
    matchIds,
    totalMatches: matchIds.length,
    open,
    close,
    toggle,
    nextMatch,
    prevMatch,
    setQuery: updateQuery,
  };
}
