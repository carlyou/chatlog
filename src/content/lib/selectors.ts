import type { Platform, PlatformSelectors } from '../../types';

const claudeSelectors: PlatformSelectors = {
  conversationItem: 'a[href^="/chat/"]',
  messageContainer: '#main-content',
};

const claudeCodeSelectors: PlatformSelectors = {
  conversationItem: 'a[href^="/code/"]',
  messageContainer: 'main',
};

const chatgptSelectors: PlatformSelectors = {
  conversationItem: 'a[href*="/c/"]',
  messageContainer: 'main',
};

export function getSelectors(platform: Platform): PlatformSelectors | null {
  if (platform === 'claude') return claudeSelectors;
  if (platform === 'claude-code') return claudeCodeSelectors;
  if (platform === 'chatgpt') return chatgptSelectors;
  return null;
}
