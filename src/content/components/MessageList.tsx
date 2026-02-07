import { useEffect, useRef, useCallback } from 'react';
import type { Message, DisplayMode } from '../../types';
import type { ActiveTarget } from '../hooks/useActiveMessage';
import { MessageBubble } from './MessageBubble';
import { SCROLL_REF_RATIO } from '../lib/constants';

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
  container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
}

interface MessageListProps {
  messages: Message[];
  displayMode: DisplayMode;
  activeMessageId: string | null;
  activeSectionIndex: number | null;
  onLockActive: (target: ActiveTarget) => void;
}

export function MessageList({ messages, displayMode, activeMessageId, activeSectionIndex, onLockActive }: MessageListProps) {
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  const setItemRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      itemRefs.current.set(id, el);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  // Auto-scroll at message level; in compact mode ignore section-level tracking
  const useSections = displayMode === 'detailed';
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

  if (messages.length === 0) {
    return (
      <div className="chatlog-outline-messages">
        <div className="chatlog-empty">No messages yet</div>
      </div>
    );
  }

  return (
    <div className="chatlog-outline-messages">
      {messages.map((msg) => (
        <div key={msg.id} ref={(el) => setItemRef(msg.id, el)}>
          <MessageBubble
            message={msg}
            displayMode={displayMode}
            isActive={msg.id === activeMessageId}
            activeSectionIndex={msg.id === activeMessageId ? activeSectionIndex : null}
            onLockActive={onLockActive}
          />
        </div>
      ))}
    </div>
  );
}
