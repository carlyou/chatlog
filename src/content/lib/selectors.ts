import type { Platform, PlatformSelectors } from '../../types';

const claudeSelectors: PlatformSelectors = {
  conversationItem: 'a[href^="/chat/"]',
  messageContainer: '#main-content',
};

const chatgptSelectors: PlatformSelectors = {
  conversationItem: 'a[href*="/c/"]',
  messageContainer: 'main',
};

export function getSelectors(platform: Platform): PlatformSelectors | null {
  if (platform === 'claude') return claudeSelectors;
  if (platform === 'chatgpt') return chatgptSelectors;
  return null;
}
