import type { Message } from '../../../types';
import {
  computeBaseSignature,
  extractBranchInfo,
  extractStructuredContent,
  getStableRootId,
} from '../parsers';
import type { ThemePalette } from '../themes';
import { registerAdapter } from './registry';
import type { PlatformAdapter } from './types';

function chatgptThemeCSS(s: string, p: ThemePalette): string {
  return `
/* ChatGPT design-token variables. Keeping them grouped so adding a new token
   only requires one place to edit. */
${s} {
  --token-main-surface-primary: ${p.bg100} !important;
  --token-main-surface-secondary: ${p.bg200} !important;
  --token-main-surface-tertiary: ${p.bg300} !important;
  --token-sidebar-surface-primary: ${p.bg200} !important;
  --token-sidebar-surface-secondary: ${p.bg300} !important;
  --token-text-primary: ${p.text100} !important;
  --token-text-secondary: ${p.text200} !important;
  --token-text-tertiary: ${p.text300} !important;
  --token-text-quaternary: ${p.text400} !important;
  --token-border-medium: ${p.border200} !important;
  --token-border-light: ${p.border100} !important;
  --token-border-heavy: ${p.border300} !important;
  --token-border-xheavy: ${p.border300} !important;
  --token-bg-primary: ${p.bg100} !important;
  --token-bg-elevated: ${p.bg200} !important;
  --token-bg-elevated-secondary: ${p.bg200} !important;
  --token-bg-subtle: ${p.bg200} !important;
  --token-bg-tertiary: ${p.bg300} !important;
  --token-surface-hover: ${p.bg300} !important;
  --token-interactive-bg-secondary-hover: ${p.bg300} !important;
  --token-interactive-bg-secondary-press: ${p.bg400} !important;
  --bg-primary: ${p.bg100} !important;
  --bg-tertiary: ${p.bg300} !important;
  --bg-elevated-secondary: ${p.bg200} !important;
  --bg-elevated-primary: ${p.bg300} !important;
  --surface-hover: ${p.bg300} !important;
  --composer-surface: ${p.bg300} !important;
  --message-surface: ${p.bg200} !important;
  --main-surface-background: ${p.bg100} !important;
  --main-surface-primary-inverse: ${p.text100} !important;
  --main-surface-secondary-selected: ${p.bg300} !important;
  --sidebar-bg: ${p.bg200} !important;
  --sidebar-mask-bg: ${p.bg200} !important;
  --sidebar-surface: ${p.bg200} !important;
  --sidebar-surface-tertiary: ${p.bg300} !important;
}

/* Sidebar wrapper divs use Tailwind arbitrary-value classes against the
   sidebar-* CSS variables — flatten background-image to disable gradients. */
${s} [class*="bg-token-sidebar"],
${s} [class*="sidebar-mask"],
${s} [class*="bg-(--sidebar"] {
  background-color: ${p.bg200} !important;
  background-image: none !important;
}

/* dark: arbitrary hex values bypass the token system; force the bg here. */
${s} [class*="dark:bg-[#"] { background-color: ${p.bg300} !important; }
${s} [class*="dark:bg-[linear-gradient"] { background-image: none !important; }

/* Input transparent overrides — the parent fieldset paints the bg. */
${s} div[data-chat-input-container="true"] [contenteditable],
${s} div[data-chat-input-container="true"] textarea {
  background-color: transparent !important;
}

/* User message bubble */
${s} .user-message-bubble-color {
  background-color: ${p.bg400} !important;
  color: ${p.text100} !important;
}

/* Source-citation badges (inline links with token classes) */
${s} a[class~="rounded-xl"][class~="text-token-"] {
  background-color: ${p.bg300} !important;
  color: ${p.text300} !important;
}

/* Composer bottom fade — ::after pseudo paints a white gradient by default. */
${s} #thread-bottom-container::after,
${s} [class~="content-fade"]::after {
  background-image: linear-gradient(transparent, ${p.bg100}) !important;
  background-color: transparent !important;
}
`;
}

const chatgptAdapter: PlatformAdapter = {
  id: 'chatgpt',
  selectors: {
    conversationItem: 'a[href*="/c/"]',
    messageContainer: 'main',
  },
  messageRootSelector: '[data-message-author-role]',
  conversationIdPattern: /\/c\/([^/]+)/,
  pinnedMarginSelectors: ['main'],

  getMessageRole(root: Element): 'user' | 'assistant' | null {
    const role = root.getAttribute('data-message-author-role');
    if (role === 'user') return 'user';
    if (role === 'assistant') return 'assistant';
    return null;
  },

  parseMessageRoot(root: Element): Message | null {
    const role = root.getAttribute('data-message-author-role');
    const text = root.textContent?.trim();
    if (!text || (role !== 'user' && role !== 'assistant')) return null;

    const id = getStableRootId(root);
    const article = root.closest('article');
    const branchInfo = article ? extractBranchInfo(article) : undefined;

    if (role === 'user') {
      const structured = extractStructuredContent(root);
      return {
        id,
        type: 'user',
        text,
        element: root,
        ...(structured.blocks.length > 0 && { structured }),
        ...(branchInfo && { branchInfo }),
      };
    }

    return {
      id,
      type: 'assistant',
      text,
      element: root,
      structured: extractStructuredContent(root),
      ...(branchInfo && { branchInfo }),
    };
  },

  computeSignature(root: Element): string {
    const role = root.getAttribute('data-message-author-role') || 'unknown';
    return computeBaseSignature(role, root);
  },

  themeCSS(scope, palette) {
    return chatgptThemeCSS(scope, palette);
  },
};

registerAdapter(chatgptAdapter);
