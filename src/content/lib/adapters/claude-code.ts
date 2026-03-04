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
    conversationItem: '.group\\/message',
    messageContainer: '#cli-button-container',
  },
  messageRootSelector: 'div[class*="content-visibility"]',
  conversationIdPattern: /\/code\/([^/]+)/,
  pinnedMarginSelectors: ['.root'],

  getMessageRole(root: Element): 'user' | 'assistant' | null {
    // User messages have a child div with items-end class
    if (
      root.querySelector(':scope > div.items-end, :scope > .flex.items-end')
    ) {
      return 'user';
    }
    // Check for the flex-col items-end pattern more broadly
    const firstChild = root.firstElementChild;
    if (firstChild?.className?.includes('items-end')) {
      return 'user';
    }
    // Assistant messages have div.mb-1 as first child
    if (root.querySelector(':scope > div.mb-1')) {
      return 'assistant';
    }
    // Fallback: if it has group/message elements, it's assistant
    if (root.querySelector('.group\\/message')) {
      return 'assistant';
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
      // User bubble is in div.bg-bg-200
      const bubble = root.querySelector('.bg-bg-200') || root;
      const structured = extractStructuredContent(bubble);
      return {
        id,
        type: 'user',
        text,
        element: root,
        ...(structured.blocks.length > 0 && { structured }),
      };
    }

    // Assistant: collect all sub-messages and tool-use sections
    const allBlocks: ContentBlock[] = [];
    const textParts: string[] = [];

    // Find all group/message elements (text sub-messages)
    const subMessages = root.querySelectorAll('.group\\/message');
    for (const msg of subMessages) {
      const contentDiv = msg.querySelector('.space-y-2');
      if (contentDiv) {
        const t = contentDiv.textContent?.trim();
        if (t) textParts.push(t);
        const { blocks } = extractStructuredContent(contentDiv);
        allBlocks.push(...blocks);
      }
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
