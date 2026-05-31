import { useEffect, useState } from 'react';
import type { Platform } from '../../types';
import {
  buildFontSizeCSS,
  clampFontSize,
  DEFAULT_FONT_SIZE,
  type FontSize,
} from '../lib/fontSize';

const FONT_SIZE_KEY = 'chatlog-font-size';
const STYLE_ID = 'chatlog-font-size-overrides';

export function useFontSize(
  shadowHost: HTMLElement | null,
  platform: Platform,
) {
  const [fontSize, setFontSizeState] = useState<FontSize>(DEFAULT_FONT_SIZE);

  // Load persisted value
  useEffect(() => {
    chrome.storage.local.get(FONT_SIZE_KEY, (result) => {
      const raw = result[FONT_SIZE_KEY];
      if (typeof raw === 'number') setFontSizeState(clampFontSize(raw));
    });
  }, []);

  // Apply to host page
  useEffect(() => {
    if (!shadowHost) return;

    if (fontSize === DEFAULT_FONT_SIZE) {
      delete document.documentElement.dataset.chatlogFontSize;
    } else {
      document.documentElement.dataset.chatlogFontSize = String(fontSize);
    }

    let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    const css = buildFontSizeCSS(fontSize, platform ?? undefined);
    if (css) {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = css;
    } else if (styleEl) {
      styleEl.remove();
    }
  }, [fontSize, shadowHost, platform]);

  const setFontSize = (n: FontSize) => {
    const clamped = clampFontSize(n);
    setFontSizeState(clamped);
    chrome.storage.local.set({ [FONT_SIZE_KEY]: clamped });
  };

  return { fontSize, setFontSize };
}
