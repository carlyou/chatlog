import { useCallback, useEffect, useRef, useState } from 'react';
import type { Message } from '../../types';
import { SCROLL_REF_RATIO } from '../lib/constants';

export interface ActiveTarget {
  messageId: string | null;
  sectionIndex: number | null;
}

const LOCK_DURATION = 800;
const SETTLE_DELAY = 150;

export function useActiveMessage(messages: Message[]): { active: ActiveTarget; lockActive: (target: ActiveTarget) => void } {
  const [active, setActive] = useState<ActiveTarget>({ messageId: null, sectionIndex: null });
  const lockRef = useRef(0);

  const lockActive = useCallback((target: ActiveTarget) => {
    setActive(target);
    lockRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;

    const elementMap = new Map<Element, { messageId: string; sectionIndex: number | null }>();

    for (const msg of messages) {
      let headingCount = 0;
      if (msg.structured) {
        for (const block of msg.structured.blocks) {
          if (block.type === 'heading' && block.element) {
            elementMap.set(block.element, { messageId: msg.id, sectionIndex: headingCount });
            headingCount++;
          }
        }
      }

      if (msg.element) {
        elementMap.set(msg.element, { messageId: msg.id, sectionIndex: null });
      }
    }

    let rafId = 0;
    let settleTimer = 0;

    const updateActive = () => {
      if (Date.now() - lockRef.current < LOCK_DURATION) return;

      const refLine = window.innerHeight * SCROLL_REF_RATIO;
      let best: { messageId: string; sectionIndex: number | null } | null = null;
      let bestDistance = Infinity;

      for (const [el, target] of elementMap) {
        const rect = el.getBoundingClientRect();
        const distance = refLine - rect.top;

        // Prefer elements whose top has scrolled above (or to) the reference line
        if (distance >= 0 && distance < bestDistance) {
          bestDistance = distance;
          best = target;
        }
      }

      // If nothing is above the reference line, pick the first element (user at very top)
      if (!best) {
        let firstEl: Element | null = null;
        let firstTop = Infinity;
        for (const [el] of elementMap) {
          const top = el.getBoundingClientRect().top;
          if (top < firstTop) {
            firstTop = top;
            firstEl = el;
          }
        }
        if (firstEl) {
          best = elementMap.get(firstEl) ?? null;
        }
      }

      if (best) {
        setActive((prev) =>
          prev.messageId === best.messageId && prev.sectionIndex === best.sectionIndex
            ? prev
            : best
        );
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      clearTimeout(settleTimer);

      if (Date.now() - lockRef.current < LOCK_DURATION + 1000) {
        // Within 1s after lock: debounce to let scroll settle
        settleTimer = window.setTimeout(updateActive, SETTLE_DELAY);
      } else {
        // Normal scroll: responsive rAF
        rafId = requestAnimationFrame(updateActive);
      }
    };

    // Run once immediately to set initial active state
    updateActive();

    window.addEventListener('scroll', onScroll, { passive: true, capture: true });

    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      cancelAnimationFrame(rafId);
      clearTimeout(settleTimer);
    };
  }, [messages]);

  return { active, lockActive };
}
