import type { Message, PlatformSelectors } from '../../../types';

export interface PlatformAdapter {
  readonly id: string;
  readonly selectors: PlatformSelectors;
  readonly messageRootSelector: string;
  readonly conversationIdPattern: RegExp;
  readonly pinnedMarginSelectors: string[];

  getMessageRole(root: Element): 'user' | 'assistant' | null;
  parseMessageRoot(root: Element): Message | null;
  computeSignature(root: Element): string;
}
