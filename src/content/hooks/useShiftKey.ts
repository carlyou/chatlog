import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { DisplayMode, Message, ShortcutConfig } from '../../types';
import type { ActiveTarget } from './useActiveMessage';
import { scrollElToRefLine } from '../components/MessageBubble';
import { matchesBinding } from '../lib/shortcutMatcher';

const MAX_HISTORY = 50;
const POST_JUMP_DELAY = 400;

interface UseShiftKeyParams {
  mode: DisplayMode;
  setMode: (m: DisplayMode) => void;
  messages: Message[];
  activeTarget: ActiveTarget;
  lockActive: (target: ActiveTarget) => void;
  shortcutConfig: ShortcutConfig;
  onPeek?: () => void;
  onTogglePin?: () => void;
  onToggleSearch?: () => void;
}

interface NavEntry {
  messageId: string;
  sectionIndex: number | null;
  element: Element;
}

/** Walk up from an element to find the nearest scrollable ancestor. */
function findScrollableAncestor(el: Element): HTMLElement | null {
  let parent = el.parentElement;
  while (parent) {
    if (parent.scrollHeight > parent.clientHeight) {
      const style = getComputedStyle(parent);
      if (style.overflowY !== 'visible' && style.overflowY !== 'hidden') {
        return parent;
      }
    }
    parent = parent.parentElement;
  }
  return null;
}

export function useShiftKey({ mode, setMode, messages, activeTarget, lockActive, shortcutConfig, onPeek, onTogglePin, onToggleSearch }: UseShiftKeyParams): { pushToHistory: () => void } {
  // --- History state (all refs to avoid re-render churn) ---
  const historyRef = useRef<number[]>([]);
  const historyIndexRef = useRef(-1);
  const isNavigatingRef = useRef(false);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const prevMessageCountRef = useRef(messages.length);

  // --- Flatten sections for sequential navigation ---
  const navEntries = useMemo<NavEntry[]>(() => {
    const entries: NavEntry[] = [];
    for (const msg of messages) {
      if (msg.element) {
        entries.push({ messageId: msg.id, sectionIndex: null, element: msg.element });
      }
      if ((mode === 'detailed' || mode === 'outline') && msg.structured) {
        let headingIdx = 0;
        for (const block of msg.structured.blocks) {
          if (block.type === 'heading' && block.element) {
            entries.push({ messageId: msg.id, sectionIndex: headingIdx, element: block.element });
            headingIdx++;
          }
        }
      }
    }
    return entries;
  }, [messages, mode]);

  // --- Helper: get scroll container (cached) ---
  const getScrollContainer = useCallback((): HTMLElement | null => {
    if (scrollContainerRef.current && scrollContainerRef.current.isConnected) {
      return scrollContainerRef.current;
    }
    const firstEl = messages.length > 0 ? messages[0].element : null;
    if (!firstEl) return null;
    const container = findScrollableAncestor(firstEl);
    scrollContainerRef.current = container;
    return container;
  }, [messages]);

  // --- Helper: get current scrollTop ---
  const getScrollTop = useCallback((): number => {
    const container = getScrollContainer();
    return container ? container.scrollTop : window.scrollY;
  }, [getScrollContainer]);

  // --- pushToHistory: called before sidebar click jumps ---
  const pushToHistory = useCallback(() => {
    if (isNavigatingRef.current) return;

    const history = historyRef.current;
    const idx = historyIndexRef.current;
    const currentTop = getScrollTop();

    // Truncate forward entries if in middle of history
    if (idx < history.length - 1) {
      history.length = idx + 1;
    }

    // Deduplicate
    if (history.length === 0 || history[history.length - 1] !== currentTop) {
      history.push(currentTop);
      if (history.length > MAX_HISTORY) history.shift();
    }
    historyIndexRef.current = history.length - 1;

    // After a short delay, also save the post-jump position
    setTimeout(() => {
      const newTop = getScrollTop();
      const h = historyRef.current;
      if (h.length === 0 || h[h.length - 1] !== newTop) {
        h.push(newTop);
        if (h.length > MAX_HISTORY) h.shift();
      }
      historyIndexRef.current = h.length - 1;
    }, POST_JUMP_DELAY);
  }, [getScrollTop]);

  // --- New-message auto-scroll history (replaces scroll monitor) ---
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    if (messages.length <= prevCount) return;
    if (isNavigatingRef.current) return;

    // New messages appeared — save pre-scroll position
    const preTop = getScrollTop();
    const history = historyRef.current;
    const idx = historyIndexRef.current;

    if (idx < history.length - 1) {
      history.length = idx + 1;
    }

    if (history.length === 0 || history[history.length - 1] !== preTop) {
      history.push(preTop);
      if (history.length > MAX_HISTORY) history.shift();
    }
    historyIndexRef.current = history.length - 1;

    // After auto-scroll settles, save post-scroll position
    setTimeout(() => {
      const postTop = getScrollTop();
      const h = historyRef.current;
      if (h.length === 0 || h[h.length - 1] !== postTop) {
        h.push(postTop);
        if (h.length > MAX_HISTORY) h.shift();
      }
      historyIndexRef.current = h.length - 1;
    }, POST_JUMP_DELAY);
  }, [messages.length, getScrollTop]);

  // --- Keydown handler ---
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    const config = shortcutConfig;

    if (matchesBinding(e, config.toggleMode)) {
      e.preventDefault();
      onPeek?.();
      const modeOrder: DisplayMode[] = ['compact', 'outline', 'detailed'];
      const nextIdx = (modeOrder.indexOf(mode) + 1) % modeOrder.length;
      setMode(modeOrder[nextIdx]);
      return;
    }

    if (matchesBinding(e, config.toggleSidebar)) {
      e.preventDefault();
      onTogglePin?.();
      return;
    }

    if (matchesBinding(e, config.toggleSearch)) {
      e.preventDefault();
      onPeek?.();
      onToggleSearch?.();
      return;
    }

    if (matchesBinding(e, config.historyBack)) {
      e.preventDefault();
      const history = historyRef.current;
      const idx = historyIndexRef.current;
      if (idx <= 0 || history.length === 0) return;

      onPeek?.();
      isNavigatingRef.current = true;
      historyIndexRef.current = idx - 1;
      const container = getScrollContainer();
      if (container) {
        container.scrollTo({ top: history[idx - 1], behavior: 'smooth' });
      }
      setTimeout(() => { isNavigatingRef.current = false; }, 500);
      return;
    }

    if (matchesBinding(e, config.historyForward)) {
      e.preventDefault();
      const history = historyRef.current;
      const idx = historyIndexRef.current;
      if (idx >= history.length - 1) return;

      onPeek?.();
      isNavigatingRef.current = true;
      historyIndexRef.current = idx + 1;
      const container = getScrollContainer();
      if (container) {
        container.scrollTo({ top: history[idx + 1], behavior: 'smooth' });
      }
      setTimeout(() => { isNavigatingRef.current = false; }, 500);
      return;
    }

    if (matchesBinding(e, config.sectionNext)) {
      e.preventDefault();
      if (navEntries.length === 0) return;

      let currentIdx = -1;
      for (let i = 0; i < navEntries.length; i++) {
        const entry = navEntries[i];
        if (entry.messageId === activeTarget.messageId && entry.sectionIndex === activeTarget.sectionIndex) {
          currentIdx = i;
          break;
        }
      }

      if (currentIdx === -1 && activeTarget.messageId) {
        for (let i = navEntries.length - 1; i >= 0; i--) {
          if (navEntries[i].messageId === activeTarget.messageId) {
            currentIdx = i;
            break;
          }
        }
      }

      const nextIdx = currentIdx + 1;
      if (nextIdx >= navEntries.length) return;

      const next = navEntries[nextIdx];
      onPeek?.();
      lockActive({ messageId: next.messageId, sectionIndex: next.sectionIndex });
      scrollElToRefLine(next.element as HTMLElement);
      return;
    }

    if (matchesBinding(e, config.sectionPrev)) {
      e.preventDefault();
      if (navEntries.length === 0) return;

      let currentIdx = -1;
      for (let i = 0; i < navEntries.length; i++) {
        const entry = navEntries[i];
        if (entry.messageId === activeTarget.messageId && entry.sectionIndex === activeTarget.sectionIndex) {
          currentIdx = i;
          break;
        }
      }

      if (currentIdx === -1 && activeTarget.messageId) {
        for (let i = navEntries.length - 1; i >= 0; i--) {
          if (navEntries[i].messageId === activeTarget.messageId) {
            currentIdx = i;
            break;
          }
        }
      }

      const prevIdx = currentIdx <= 0 ? -1 : currentIdx - 1;
      if (prevIdx < 0) return;

      const prev = navEntries[prevIdx];
      onPeek?.();
      lockActive({ messageId: prev.messageId, sectionIndex: prev.sectionIndex });
      scrollElToRefLine(prev.element as HTMLElement);
      return;
    }
  }, [mode, setMode, navEntries, activeTarget, lockActive, getScrollContainer, shortcutConfig, onPeek, onTogglePin, onToggleSearch]);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  return { pushToHistory };
}
