import type { Platform } from '../../types';

export function detectPlatform(): Platform {
  const hostname = window.location.hostname;
  if (hostname.includes('claude.ai')) {
    const path = window.location.pathname;
    if (path.startsWith('/code')) return 'claude-code';
    return 'claude';
  }
  if (hostname.includes('chatgpt.com')) return 'chatgpt';
  return null;
}
