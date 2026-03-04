import type { PlatformAdapter } from './types';

const adapters: Record<string, PlatformAdapter> = {};

export function registerAdapter(adapter: PlatformAdapter): void {
  adapters[adapter.id] = adapter;
}

export function getAdapter(id: string): PlatformAdapter | null {
  return adapters[id] ?? null;
}

export function detectPlatform(): string | null {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  if (hostname.includes('claude.ai')) {
    if (pathname.startsWith('/code/')) return 'claude-code';
    return 'claude';
  }
  if (hostname.includes('chatgpt.com')) return 'chatgpt';
  return null;
}
