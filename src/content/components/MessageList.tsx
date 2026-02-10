import { useEffect, useRef, useCallback } from 'react';
import type { Message, DisplayMode } from '../../types';
import type { ActiveTarget } from '../hooks/useActiveMessage';
import { MessageBubble } from './MessageBubble';
import { SCROLL_REF_RATIO } from '../lib/constants';

const SCROLL_DURATION = 240; // ms — fast but smooth

/** Scroll so the element's top edge sits at SCROLL_REF_RATIO from the top of its scroll container. */
export function scrollToTopCenter(el: HTMLElement, container: HTMLElement) {
  // Walk up offsetParent chain to get position relative to the scroll container
  let top = 0;
  let current: HTMLElement | null = el;
  while (current && current !== container) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  const targetScrollTop = top - container.clientHeight * SCROLL_REF_RATIO;
  const startScrollTop = container.scrollTop;
  const distance = targetScrollTop - startScrollTop;

  if (Math.abs(distance) < 1) return;

  const startTime = performance.now();
  const step = (now: number) => {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / SCROLL_DURATION, 1);
    const ease = 1 - (1 - t) * (1 - t); // easeOutQuad
    container.scrollTop = startScrollTop + distance * ease;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

interface MessageListProps {
  messages: Message[];
  displayMode: DisplayMode;
  activeMessageId: string | null;
  activeSectionIndex: number | null;
  onLockActive: (target: ActiveTarget) => void;
  onJumpNavigate?: () => void;
  searchQuery?: string;
  searchMatchIds?: string[];
  currentSearchMatchId?: string | null;
  bookmarkFilter?: boolean;
  isBookmarked?: (messageId: string) => boolean;
  onToggleBookmark?: (messageId: string) => void;
}

export function MessageList({ messages, displayMode, activeMessageId, activeSectionIndex, onLockActive, onJumpNavigate, searchQuery, searchMatchIds, currentSearchMatchId, bookmarkFilter, isBookmarked, onToggleBookmark }: MessageListProps) {
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  const setItemRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      itemRefs.current.set(id, el);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  // Auto-scroll at message level; in compact mode ignore section-level tracking
  const useSections = displayMode === 'detailed' || displayMode === 'outline';
  useEffect(() => {
    if (!activeMessageId || (useSections && activeSectionIndex !== null)) return;
    const el = itemRefs.current.get(activeMessageId);
    if (el) {
      const container = el.closest('.chatlog-outline-messages') as HTMLElement | null;
      if (container) {
        scrollToTopCenter(el, container);
      }
    }
  }, [activeMessageId, activeSectionIndex, useSections]);

  // Auto-scroll to current search match
  useEffect(() => {
    if (!currentSearchMatchId) return;
    const el = itemRefs.current.get(currentSearchMatchId);
    if (el) {
      const container = el.closest('.chatlog-outline-messages') as HTMLElement | null;
      if (container) {
        scrollToTopCenter(el, container);
      }
    }
  }, [currentSearchMatchId]);

  if (messages.length === 0) {
    return (
      <div className="chatlog-outline-messages">
        <div className="chatlog-empty">No messages yet</div>
      </div>
    );
  }

  const hasSearch = searchQuery && searchQuery.trim().length > 0;
  const matchSet = searchMatchIds ? new Set(searchMatchIds) : null;

  return (
    <div className="chatlog-outline-messages">
      {messages.map((msg) => {
        // Bookmark filter
        if (bookmarkFilter && isBookmarked && !isBookmarked(msg.id)) return null;
        // Search dimming
        const isDimmed = hasSearch && matchSet && !matchSet.has(msg.id);
        const isSearchHighlight = currentSearchMatchId === msg.id;
        return (
          <div
            key={msg.id}
            ref={(el) => setItemRef(msg.id, el)}
            className={`${isDimmed ? 'chatlog-search-dimmed' : ''}${isSearchHighlight ? ' chatlog-search-highlight' : ''}`}
          >
            <MessageBubble
              message={msg}
              displayMode={displayMode}
              isActive={msg.id === activeMessageId}
              activeSectionIndex={msg.id === activeMessageId ? activeSectionIndex : null}
              onLockActive={onLockActive}
              onJumpNavigate={onJumpNavigate}
              searchQuery={hasSearch ? searchQuery : undefined}
              bookmarked={isBookmarked?.(msg.id)}
              onToggleBookmark={onToggleBookmark ? () => onToggleBookmark(msg.id) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
