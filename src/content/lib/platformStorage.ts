import type { Platform } from '../../types';

/**
 * Per-platform `chrome.storage.local` helpers. We started with a single
 * shared key per setting, which meant a user's preferred font on
 * claude.ai/chat would also follow them to claude.ai/code (and chatgpt).
 * Each platform has its own DOM, layout, and content density, so most
 * preferences should be remembered independently.
 *
 * Strategy:
 *   - Per-platform key:  `{baseKey}:{platform}`  (e.g. `chatlog-font:claude-code`)
 *   - Legacy shared key: `{baseKey}`             (e.g. `chatlog-font`)
 *
 * `readPlatformPref` prefers the per-platform value and transparently
 * falls back to the legacy shared one so existing users don't lose their
 * settings when they upgrade. We only ever write to the per-platform
 * key going forward.
 */
export function platformKey(baseKey: string, platform: Platform): string {
  if (!platform) return baseKey;
  return `${baseKey}:${platform}`;
}

export function readPlatformPref<T>(
  baseKey: string,
  platform: Platform,
  cb: (value: T | undefined) => void,
): void {
  const pKey = platformKey(baseKey, platform);
  chrome.storage.local.get([pKey, baseKey], (result) => {
    if (result[pKey] !== undefined) {
      cb(result[pKey] as T);
    } else if (result[baseKey] !== undefined) {
      cb(result[baseKey] as T);
    } else {
      cb(undefined);
    }
  });
}

export function writePlatformPref<T>(
  baseKey: string,
  platform: Platform,
  value: T,
): void {
  chrome.storage.local.set({ [platformKey(baseKey, platform)]: value });
}
