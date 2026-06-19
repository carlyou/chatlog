import { useEffect, useState } from 'react';
import type { Platform } from '../../types';
import {
  buildFontWeightCSS,
  clampFontWeight,
  DEFAULT_FONT_WEIGHT,
  type FontWeight,
} from '../lib/fontWeight';
import { readPlatformPref, writePlatformPref } from '../lib/platformStorage';

const FONT_WEIGHT_KEY_BASE = 'chatlog-font-weight';
const STYLE_ID = 'chatlog-font-weight-overrides';

export function useFontWeight(
  shadowHost: HTMLElement | null,
  platform: Platform,
) {
  const [fontWeight, setFontWeightState] =
    useState<FontWeight>(DEFAULT_FONT_WEIGHT);

  // Load persisted value
  useEffect(() => {
    readPlatformPref<number>(FONT_WEIGHT_KEY_BASE, platform, (value) => {
      if (typeof value === 'number') setFontWeightState(clampFontWeight(value));
    });
  }, [platform]);

  // Apply to host page
  useEffect(() => {
    if (!shadowHost) return;

    if (fontWeight === DEFAULT_FONT_WEIGHT) {
      delete document.documentElement.dataset.chatlogFontWeight;
    } else {
      document.documentElement.dataset.chatlogFontWeight = String(fontWeight);
    }

    let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    const css = buildFontWeightCSS(fontWeight, platform ?? undefined);
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
  }, [fontWeight, shadowHost, platform]);

  const setFontWeight = (n: FontWeight) => {
    const clamped = clampFontWeight(n);
    setFontWeightState(clamped);
    writePlatformPref(FONT_WEIGHT_KEY_BASE, platform, clamped);
  };

  return { fontWeight, setFontWeight };
}
