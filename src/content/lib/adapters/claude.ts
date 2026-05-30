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

function claudeThemeCSS(s: string, p: ThemePalette): string {
  return `
/* Claude /chat: content-area buttons — override white backgrounds; keep
   nav/sidebar buttons natural so they inherit nav theming. */
${s} #main-content button:not([class~="bg-accent"]),
${s} main button:not([class~="bg-accent"]) {
  background-color: ${p.bg300} !important;
  color: ${p.text200} !important;
}
${s} #main-content button:hover:not([class~="bg-accent"]),
${s} main button:hover:not([class~="bg-accent"]) {
  background-color: ${p.bg400} !important;
}
/* Thinking-status button blends with parent */
${s} #main-content button.group\\/status,
${s} main button.group\\/status { background-color: transparent !important; }

/* Chat input container — transparent inner elements so the fieldset is the
   only visible chrome. */
${s} div[data-chat-input-container="true"] [contenteditable],
${s} div[data-chat-input-container="true"] textarea {
  background-color: transparent !important;
}
`;
}

const claudeAdapter: PlatformAdapter = {
  id: 'claude',
  selectors: {
    conversationItem: 'a[href^="/chat/"]',
    messageContainer: '#main-content',
  },
  messageRootSelector: 'div.group.relative',
  conversationIdPattern: /\/chat\/([^/]+)/,
  pinnedMarginSelectors: ['#main-content'],

  getMessageRole(root: Element): 'user' | 'assistant' | null {
    if (root.className.includes('bg-bg-300')) return 'user';
    return 'assistant';
  },

  parseMessageRoot(root: Element): Message | null {
    const text = root.textContent?.trim();
    if (!text) return null;

    const id = getStableRootId(root);
    const isUserMessage = root.className.includes('bg-bg-300');

    if (isUserMessage) {
      const grandparent = root.parentElement?.parentElement;
      const searchScope = grandparent || root;
      const structured = extractStructuredContent(searchScope);
      const branchScope =
        root.closest('[data-test-render-count]') || grandparent;
      const branchInfo = branchScope
        ? extractBranchInfo(branchScope)
        : undefined;
      return {
        id,
        type: 'user',
        text,
        element: root,
        ...(structured.blocks.length > 0 && { structured }),
        ...(branchInfo && { branchInfo }),
      };
    }

    const responseContainers = root.querySelectorAll('[class*="row-start-2"]');
    const branchScope = root.closest('[data-test-render-count]') || root;
    const branchInfo = extractBranchInfo(branchScope);

    if (responseContainers.length > 0) {
      const textParts: string[] = [];
      const allBlocks: import('../../../types').ContentBlock[] = [];
      for (const rc of responseContainers) {
        const t = rc.textContent?.trim();
        if (t) textParts.push(t);
        const { blocks } = extractStructuredContent(rc);
        allBlocks.push(...blocks);
      }

      const responseText = textParts.join('\n');
      if (responseText) {
        return {
          id,
          type: 'assistant',
          text: responseText,
          element: responseContainers[0],
          structured: { blocks: allBlocks },
          ...(branchInfo && { branchInfo }),
        };
      }
    }

    const structured = extractStructuredContent(root);
    return {
      id,
      type: 'assistant',
      text,
      element: root,
      ...(structured.blocks.length > 0 && { structured }),
      ...(branchInfo && { branchInfo }),
    };
  },

  computeSignature(root: Element): string {
    const role = root.className.includes('bg-bg-300') ? 'user' : 'assistant';
    return computeBaseSignature(role, root);
  },

  themeCSS(scope, palette) {
    return claudeThemeCSS(scope, palette);
  },
};

registerAdapter(claudeAdapter);
