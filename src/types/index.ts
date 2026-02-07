export type DisplayMode = 'compact' | 'detailed';

export interface RichSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

export type RichText = RichSegment[];

export type ContentBlock =
  | { type: 'heading'; text: string; element?: Element }
  | { type: 'paragraph'; segments: RichText }
  | { type: 'list'; items: RichText[] }
  | { type: 'code'; text: string }
  | { type: 'divider' }
  | { type: 'image'; src: string; alt: string }
  | { type: 'file'; name: string; info: string; ext: string };

export interface StructuredContent {
  blocks: ContentBlock[];
}

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  element: Element;
  structured?: StructuredContent;
}

export type Platform = 'claude' | 'chatgpt' | null;

export interface PlatformSelectors {
  conversationItem: string;
  messageContainer: string;
}
