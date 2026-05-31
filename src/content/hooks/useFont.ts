import { useEffect, useState } from 'react';
import type { Platform } from '../../types';
import type { FontId } from '../lib/fonts';
import { buildFontCSS } from '../lib/fonts';
import { readPlatformPref, writePlatformPref } from '../lib/platformStorage';

const FONT_KEY_BASE = 'chatlog-font';
const STYLE_ID = 'chatlog-font-overrides';

export function useFont(shadowHost: HTMLElement | null, platform: Platform) {
  const [font, setFontState] = useState<FontId>('system');

  // Load persisted value
  useEffect(() => {
    readPlatformPref<FontId>(FONT_KEY_BASE, platform, (value) => {
      if (value) setFontState(value);
    });
  }, [platform]);

  // Apply font to host page
  useEffect(() => {
    if (!shadowHost) return;

    if (font === 'system') {
      delete document.documentElement.dataset.chatlogFont;
    } else {
      document.documentElement.dataset.chatlogFont = font;
    }

    // Inject CSS overrides into host page
    let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    const css = buildFontCSS(font);
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
  }, [font, shadowHost]);

  const setFont = (id: FontId) => {
    setFontState(id);
    writePlatformPref(FONT_KEY_BASE, platform, id);
  };

  return { font, setFont };
}
