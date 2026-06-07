import { useEffect, useState } from 'react';
import type { Platform } from '../../types';
import { getAdapter } from '../lib/adapters/registry';
import { readPlatformPref, writePlatformPref } from '../lib/platformStorage';
import type { ThemeId } from '../lib/themes';
import { getHostCSS, isLightTheme, PALETTES } from '../lib/themes';

const THEME_KEY_BASE = 'chatlog-theme';
const GLASS_KEY_BASE = 'chatlog-glass';
const STYLE_ID = 'chatlog-theme-overrides';
const BG_MARKER = 'chatlogbg';

// Skip transparent fixed-position overlays (e.g. Claude Code's epitaxy-root
// at z:60 with pointer-events:none). Painting them solid would occlude the
// entire viewport.
function isTransparentOverlay(el: HTMLElement): boolean {
  const s = getComputedStyle(el);
  return s.position === 'fixed' && s.pointerEvents === 'none';
}

/**
 * Walk from multiple starting points up to body, setting inline background-color
 * on every ancestor. This is the only reliable way to override backgrounds
 * regardless of what CSS classes, variables, or inline styles the site uses.
 */
function applyBgOverrides(platform: Platform, bgColor: string) {
  const adapter = platform ? getAdapter(platform) : null;
  if (!adapter) return;

  // Collect multiple starting elements to ensure we cover all content containers.
  // Different adapters use different selectors and the messageContainer may not
  // share ancestors with the main visible content area (e.g. Claude Code's
  // #cli-button-container is in the input area, not the conversation scroll area).
  const startSelectors = [
    adapter.selectors.messageContainer,
    ...adapter.pinnedMarginSelectors,
    '#main-content',
    'main',
  ];

  const overridden = new Set<HTMLElement>();

  for (const selector of startSelectors) {
    const container = document.querySelector(selector);
    if (!container) continue;

    let el: HTMLElement | null = container as HTMLElement;
    while (el && el !== document.documentElement) {
      if (
        el.id !== 'chatlog-root' &&
        !overridden.has(el) &&
        !isTransparentOverlay(el)
      ) {
        overridden.add(el);
        el.dataset[BG_MARKER] = '';
        el.style.setProperty('background-color', bgColor, 'important');
      }
      el = el.parentElement;
    }
  }

  // Also override body's direct children (app root wrappers)
  for (const child of document.body.children) {
    const htmlChild = child as HTMLElement;
    if (htmlChild.id === 'chatlog-root' || !htmlChild.style) continue;
    if (overridden.has(htmlChild)) continue;
    if (isTransparentOverlay(htmlChild)) continue;
    htmlChild.dataset[BG_MARKER] = '';
    htmlChild.style.setProperty('background-color', bgColor, 'important');
  }
}

/**
 * Remove all inline background overrides we previously applied.
 */
function removeBgOverrides() {
  for (const el of document.querySelectorAll('[data-chatlogbg]')) {
    const htmlEl = el as HTMLElement;
    htmlEl.style.removeProperty('background-color');
    delete htmlEl.dataset[BG_MARKER];
  }
}

export function useTheme(shadowHost: HTMLElement | null, platform: Platform) {
  const [theme, setThemeState] = useState<ThemeId>('system');
  const [glass, setGlassState] = useState(true);

  // Load persisted values
  useEffect(() => {
    readPlatformPref<ThemeId>(THEME_KEY_BASE, platform, (value) => {
      if (value) setThemeState(value);
    });
    readPlatformPref<boolean>(GLASS_KEY_BASE, platform, (value) => {
      if (typeof value === 'boolean') setGlassState(value);
    });
  }, [platform]);

  // Apply theme to shadow host + document
  useEffect(() => {
    if (!shadowHost) return;

    // Always clean up previous overrides first
    removeBgOverrides();
    const adapter = platform ? getAdapter(platform) : null;
    adapter?.applyThemeSideEffects?.(theme);

    if (theme === 'system') {
      shadowHost.removeAttribute('data-theme');
      delete document.documentElement.dataset.chatlogTheme;
      document.documentElement.style.removeProperty('color-scheme');
    } else {
      shadowHost.dataset.theme = theme;
      document.documentElement.dataset.chatlogTheme = theme;
    }

    // Inject CSS overrides into host page
    let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    const css = getHostCSS(theme, platform ?? undefined);
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

    // Force color-scheme and JS-based background overrides
    if (theme !== 'system') {
      const scheme = isLightTheme(theme) ? 'light' : 'dark';
      document.documentElement.style.setProperty('color-scheme', scheme);
      const palette = PALETTES[theme];
      applyBgOverrides(platform, palette.bg100);
    }
  }, [theme, shadowHost, platform]);

  // Apply glass attribute
  useEffect(() => {
    if (!shadowHost) return;
    if (glass) {
      shadowHost.dataset.glass = '';
    } else {
      delete shadowHost.dataset.glass;
    }
  }, [glass, shadowHost]);

  const setTheme = (id: ThemeId) => {
    setThemeState(id);
    writePlatformPref(THEME_KEY_BASE, platform, id);
  };

  const setGlass = (enabled: boolean) => {
    setGlassState(enabled);
    writePlatformPref(GLASS_KEY_BASE, platform, enabled);
  };

  return { theme, setTheme, glass, setGlass };
}
