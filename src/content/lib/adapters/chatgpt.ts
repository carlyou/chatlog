import type { Message } from '../../../types';
import {
  computeBaseSignature,
  extractBranchInfo,
  extractStructuredContent,
  getStableRootId,
} from '../parsers';
import { registerAdapter } from './registry';
import type { PlatformAdapter } from './types';

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
};

registerAdapter(chatgptAdapter);
