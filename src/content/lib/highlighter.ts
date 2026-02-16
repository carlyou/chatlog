import { scrollElToRefLine } from '../components/MessageBubble';

const HIGHLIGHT_CLASS = 'chatlog-main-highlight';
const HIGHLIGHT_CURRENT_CLASS = 'chatlog-main-highlight-current';
const HIGHLIGHT_ATTR = 'data-chatlog-highlight';

/**
 * Recursively wrap text matches with <mark> elements inside a container.
 */
function highlightNode(node: Node, query: string): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    if (!text.toLowerCase().includes(query.toLowerCase())) return;

    const parent = node.parentElement;
    if (!parent) return;
    if (
      parent.hasAttribute(HIGHLIGHT_ATTR) ||
      parent.tagName === 'SCRIPT' ||
      parent.tagName === 'STYLE' ||
      parent.tagName === 'NOSCRIPT'
    ) return;

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    if (parts.length <= 1) return;

    const frag = document.createDocumentFragment();
    for (const part of parts) {
      if (part.toLowerCase() === query.toLowerCase()) {
        const mark = document.createElement('mark');
        mark.className = HIGHLIGHT_CLASS;
        mark.setAttribute(HIGHLIGHT_ATTR, '');
        mark.textContent = part;
        frag.appendChild(mark);
      } else if (part) {
        frag.appendChild(document.createTextNode(part));
      }
    }
    parent.replaceChild(frag, node);
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    if (el.classList?.contains('chatlog-sidebar')) return;
    const children = Array.from(node.childNodes);
    for (const child of children) highlightNode(child, query);
  }
}

function clearHighlights(container: Element): void {
  const marks = container.querySelectorAll(`mark[${HIGHLIGHT_ATTR}]`);
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
      parent.normalize();
    }
  });
}

export function highlightMainConversation(container: Element | null, query: string): void {
  if (!container) return;
  clearHighlights(container);
  if (query.trim()) highlightNode(container, query.trim());
}

export function clearMainHighlights(container: Element | null): void {
  if (container) clearHighlights(container);
}

/**
 * Set the "current" highlight on a specific <mark> in the main conversation.
 * Clears any previous current highlight first.
 */
export function setCurrentMainHighlight(container: Element | null, index: number): void {
  if (!container) return;
  // Clear previous
  container.querySelectorAll(`.${HIGHLIGHT_CURRENT_CLASS}`).forEach((el) => {
    el.classList.remove(HIGHLIGHT_CURRENT_CLASS);
  });
  // Set new
  const marks = container.querySelectorAll(`mark[${HIGHLIGHT_ATTR}]`);
  if (index >= 0 && index < marks.length) {
    const mark = marks[index] as HTMLElement;
    mark.classList.add(HIGHLIGHT_CURRENT_CLASS);
    scrollElToRefLine(mark);
  }
}

/** Count how many highlight marks exist in the main conversation. */
export function countMainHighlights(container: Element | null): number {
  if (!container) return 0;
  return container.querySelectorAll(`mark[${HIGHLIGHT_ATTR}]`).length;
}

/** Get the <mark> element at a given index (for finding which message it belongs to). */
export function getMainHighlightAt(container: Element | null, index: number): HTMLElement | null {
  if (!container) return null;
  const marks = container.querySelectorAll(`mark[${HIGHLIGHT_ATTR}]`);
  if (index >= 0 && index < marks.length) return marks[index] as HTMLElement;
  return null;
}
