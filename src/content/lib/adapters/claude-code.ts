import type { ContentBlock, Message } from '../../../types';
import {
  computeBaseSignature,
  extractStructuredContent,
  getStableRootId,
} from '../parsers';
import { registerAdapter } from './registry';
import type { PlatformAdapter } from './types';

const claudeCodeAdapter: PlatformAdapter = {
  id: 'claude-code',
  selectors: {
    conversationItem: '[data-epitaxy-entry]',
    messageContainer: '[data-testid="epitaxy-virtual-transcript"]',
  },
  messageRootSelector: '[data-epitaxy-entry]',
  conversationIdPattern: /\/code\/([^/]+)/,
  pinnedMarginSelectors: ['.dframe-content-inner'],

  getMessageRole(root: Element): 'user' | 'assistant' | null {
    // User messages contain an element with the user-message-background class
    if (root.querySelector('[class*="ui-user-message-background"]')) {
      return 'user';
    }
    // Assistant messages contain epitaxy-markdown content
    if (root.querySelector('.epitaxy-markdown')) {
      return 'assistant';
    }
    // Fallback: check the data-epitaxy-entry value format
    const entryId = root.getAttribute('data-epitaxy-entry');
    if (entryId) {
      if (entryId.startsWith('msg_')) return 'assistant';
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-/.test(entryId)) return 'user';
    }
    return null;
  },

  parseMessageRoot(root: Element): Message | null {
    const text = root.textContent?.trim();
    if (!text) return null;

    const id = getStableRootId(root);
    const role = this.getMessageRole(root);
    if (!role) return null;

    if (role === 'user') {
      const bubble =
        root.querySelector('[class*="ui-user-message-background"]') || root;
      const structured = extractStructuredContent(bubble);
      return {
        id,
        type: 'user',
        text,
        element: root,
        ...(structured.blocks.length > 0 && { structured }),
      };
    }

    // Assistant: collect content from .epitaxy-markdown elements
    const allBlocks: ContentBlock[] = [];
    const textParts: string[] = [];

    const markdownSections = root.querySelectorAll('.epitaxy-markdown');
    for (const section of markdownSections) {
      const t = section.textContent?.trim();
      if (t) textParts.push(t);
      const { blocks } = extractStructuredContent(section);
      allBlocks.push(...blocks);
    }

    const fullText = textParts.join('\n') || text;
    return {
      id,
      type: 'assistant',
      text: fullText,
      element: root,
      structured: { blocks: allBlocks },
    };
  },

  computeSignature(root: Element): string {
    const role = this.getMessageRole(root) || 'unknown';
    return computeBaseSignature(role, root);
  },
};

registerAdapter(claudeCodeAdapter);
