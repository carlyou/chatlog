import type { Message } from '../../../types';
import {
  computeBaseSignature,
  extractBranchInfo,
  extractStructuredContent,
  getStableRootId,
} from '../parsers';
import { registerAdapter } from './registry';
import type { PlatformAdapter } from './types';

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
};

registerAdapter(claudeAdapter);
