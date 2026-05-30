import type { ContentBlock, Message } from '../../../types';
import {
  computeBaseSignature,
  extractStructuredContent,
  getStableRootId,
} from '../parsers';
import {
  hexToHsl,
  isLightTheme,
  PALETTES,
  type ThemeId,
  type ThemePalette,
} from '../themes';
import { registerAdapter } from './registry';
import type { PlatformAdapter, ThemeScheme } from './types';

const ORIG_MODE_ATTR = 'data-chatlog-orig-mode';
const CODE_STYLE_ID = 'chatlog-code-tokens';

/**
 * Map of Claude Code's syntax-highlighter token hex values to palette
 * buckets. Each map covers one host mode (light or dark) because the
 * highlighter ships separate hex values per mode in the same span style
 * attribute (`--diffs-token-light` / `--diffs-token-dark`).
 *
 * The buckets come from inspecting which highlighter color shows up on
 * which token kind in a representative TypeScript block:
 *   comment, keyword, type, punctuation, function, identifier, string.
 */
type TokenBucket =
  | 'comment'
  | 'keyword'
  | 'type'
  | 'punctuation'
  | 'function'
  | 'identifier'
  | 'string';

const DARK_TOKEN_HEX: Record<string, TokenBucket> = {
  '#737373': 'comment',
  '#FA832E': 'keyword',
  '#B796FF': 'type',
  '#A6A6A6': 'punctuation',
  '#0099FF': 'function',
  '#EDEDED': 'identifier',
  '#32D74B': 'string',
};

const LIGHT_TOKEN_HEX: Record<string, TokenBucket> = {
  '#999999': 'comment',
  '#C5621B': 'keyword',
  '#8E6BD9': 'type',
  '#737373': 'punctuation',
  '#0073E6': 'function',
  '#1A1A1A': 'identifier',
  '#1E9E3C': 'string',
};

function bucketColor(b: TokenBucket, p: ThemePalette): string {
  switch (b) {
    case 'comment':
      return p.text500;
    case 'keyword':
      return p.yellow;
    case 'type':
      return p.purple;
    case 'punctuation':
      return p.text400;
    case 'function':
      return p.cyan;
    case 'identifier':
      return p.text100;
    case 'string':
      return p.green;
  }
}

/**
 * Build the CSS injected into each `<diffs-container>` shadow root to
 * recolor syntax tokens to the active theme. Matches via attribute
 * substring on the inline `style="--diffs-token-*: #XXX"`, since the
 * highlighter doesn't put token-type classes on spans.
 */
function buildCodeTokenCSS(p: ThemePalette, scheme: ThemeScheme): string {
  const map = scheme === 'dark' ? DARK_TOKEN_HEX : LIGHT_TOKEN_HEX;
  const prop = scheme === 'dark' ? '--diffs-token-dark' : '--diffs-token-light';
  const rules: string[] = [];
  for (const [hex, bucket] of Object.entries(map)) {
    rules.push(
      `span[style*="${prop}:${hex}"] { color: ${bucketColor(bucket, p)} !important; }`,
    );
  }
  return rules.join('\n');
}

let codeBlockObserver: MutationObserver | null = null;
let activeTokenCSS: string | null = null;

function injectIntoContainer(container: Element, css: string | null): void {
  const sr = (container as HTMLElement & { shadowRoot: ShadowRoot | null })
    .shadowRoot;
  if (!sr) return;
  let style = sr.querySelector<HTMLStyleElement>(`#${CODE_STYLE_ID}`);
  if (css === null) {
    style?.remove();
    return;
  }
  if (!style) {
    style = document.createElement('style');
    style.id = CODE_STYLE_ID;
    sr.appendChild(style);
  }
  if (style.textContent !== css) style.textContent = css;
}

function applyToAllContainers(css: string | null): void {
  for (const dc of document.querySelectorAll('diffs-container')) {
    injectIntoContainer(dc, css);
  }
}

function syncCodeBlockStyles(theme: ThemeId): void {
  if (theme === 'system') {
    codeBlockObserver?.disconnect();
    codeBlockObserver = null;
    applyToAllContainers(null);
    activeTokenCSS = null;
    return;
  }
  const palette = PALETTES[theme];
  const scheme: ThemeScheme = isLightTheme(theme) ? 'light' : 'dark';
  activeTokenCSS = buildCodeTokenCSS(palette, scheme);
  applyToAllContainers(activeTokenCSS);
  if (codeBlockObserver) return;
  codeBlockObserver = new MutationObserver((records) => {
    if (!activeTokenCSS) return;
    for (const r of records) {
      for (const node of r.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const el = node as Element;
        if (el.matches?.('diffs-container')) {
          injectIntoContainer(el, activeTokenCSS);
        } else {
          for (const dc of el.querySelectorAll?.('diffs-container') ?? []) {
            injectIntoContainer(dc, activeTokenCSS);
          }
        }
      }
    }
  });
  codeBlockObserver.observe(document.body, { childList: true, subtree: true });
}

/**
 * Claude Code defines its semantic color tokens (--text-assistant-primary,
 * --ui-user-message-primary-text, derived t/z scales, fill/border/surface
 * helpers — 90+ properties) inside `[data-mode="dark"] .epitaxy-root { ... }`.
 * If we override only the bottom-most palette but leave `data-mode="light"`,
 * descendants like the Accept-edits button or user message bubble still
 * resolve to the page's light-mode dark text. Flip data-mode in lockstep
 * with our theme so the page's own dark-mode rules apply, then layer our
 * palette on top.
 */
function syncPageDataMode(theme: string): void {
  const html = document.documentElement;
  if (theme === 'system') {
    const orig = html.getAttribute(ORIG_MODE_ATTR);
    if (orig === null) return;
    if (orig === '') html.removeAttribute('data-mode');
    else html.setAttribute('data-mode', orig);
    html.removeAttribute(ORIG_MODE_ATTR);
    return;
  }
  if (!html.hasAttribute(ORIG_MODE_ATTR)) {
    html.setAttribute(ORIG_MODE_ATTR, html.getAttribute('data-mode') ?? '');
  }
  // isLightTheme accepts the broader ThemeId union; we already excluded 'system'.
  html.setAttribute(
    'data-mode',
    isLightTheme(theme as Parameters<typeof isLightTheme>[0])
      ? 'light'
      : 'dark',
  );
}

function claudeCodeThemeCSS(
  s: string,
  p: ThemePalette,
  scheme: 'light' | 'dark',
): string {
  // The mask-image: linear-gradient(hsl(var(--always-black)), transparent)
  // pattern on long-text fades resolves to luminance under mask-mode: match-
  // source for CSS images, so the mask "visible" stop needs high luminance
  // (white) for dark themes — a dark override would erase the text.
  const alwaysBlack = scheme === 'light' ? '0 0% 0%' : '0 0% 100%';
  return `
/* Claude Code (epitaxy): semantic token + CDS overrides. */
${s} {
  --t1: ${p.bg200} !important;
  --t2: ${p.bg300} !important;
  --t3: ${p.bg400} !important;
  --t4: ${p.text500} !important;
  --t5: ${p.text400} !important;
  --t6: ${p.text300} !important;
  --t7: ${p.text200} !important;
  --t8: ${p.text100} !important;
  --t9: ${p.text100} !important;
  --always-black: ${alwaysBlack} !important;
  --accent: ${p.accent} !important;
  --accent-hover: ${p.accentHover} !important;
  --accent-brand: ${p.accent} !important;
  --accent-100: ${hexToHsl(p.accent)} !important;
  --surface-primary: ${p.bg100} !important;
  --surface-primary-elevated: ${p.bg200} !important;
  --ui-user-message-background: ${p.bg400} !important;
  --ui-user-message-primary-text: ${p.text100} !important;
  --fill-uncontained-default: transparent !important;
  --fill-uncontained-hover: ${p.bg300} !important;
  --fill-uncontained-selected: ${p.bg400} !important;
  --fill-contained-default: ${p.bg300} !important;
  --fill-contained-hover: ${p.bg400} !important;
  --text-uncontained-default: ${p.text200} !important;
  --text-uncontained-hover: ${p.text100} !important;
  --text-uncontained-selected: ${p.text100} !important;
  --text-contained-default: ${p.text100} !important;
  --text-contained-hover: ${p.text100} !important;
  --df-surface-primary: ${hexToHsl(p.bg200)} !important;
  --df-hover: ${p.bg300} !important;
}

/* .epitaxy-root sets its own --t* scale on itself, so we re-override there:
   inherited CSS variables come from the nearest defining ancestor, which would
   otherwise leak the page's light-mode token values into descendants like
   .text-t9. */
${s} .cds-root, ${s} [data-mode], ${s} .epitaxy-root {
  color-scheme: ${scheme} !important;
  --t1: ${p.bg200} !important; --t2: ${p.bg300} !important; --t3: ${p.bg400} !important;
  --t4: ${p.text400} !important; --t5: ${p.text300} !important; --t6: ${p.text200} !important;
  --t7: ${p.text200} !important; --t8: ${p.text100} !important; --t9: ${p.text100} !important;
}

/* Surfaces and message containers */
${s} [data-epitaxy-entry] { color: ${p.text200} !important; }
${s} [data-surface] { background-color: ${p.bg200} !important; }
${s} .epitaxy-markdown { background-color: transparent !important; }
${s} .dframe-content-inner { background-color: ${p.bg100} !important; }
${s} .dframe-sidebar-body { background-color: ${p.bg200} !important; }

/* Buttons in epitaxy are transparent by default; hover gets a subtle wash. */
${s} main button { background-color: transparent !important; color: inherit !important; }
${s} main button:hover { background-color: ${p.bg300} !important; }

/* Prompt surface — the compact bubble is themed; the editor inside is
   transparent so only the bubble's bg shows. */
${s} .epitaxy-prompt { background-color: ${p.bg200} !important; }
${s} .epitaxy-prompt [contenteditable] {
  color: ${p.text100} !important;
  background-color: transparent !important;
}

/* Diff/code views — keep dark token variants regardless of host mode. */
${s} .epitaxy-diff { background-color: ${p.bg200} !important; color: ${p.text100} !important; color-scheme: ${scheme} !important; }
${s} diffs-container { color: ${p.text100} !important; color-scheme: ${scheme} !important; }
${s} [data-content] span[style*="--diffs-token-dark"] { color: var(--diffs-token-dark) !important; }
${s} [data-gutter] [data-line-number-content] { color: ${p.text500} !important; }

/* Scroll-fade scrims at top/bottom of transcript */
${s} .epitaxy-top-scrim { background: linear-gradient(to bottom, ${p.bg100}, transparent) !important; }
${s} .epitaxy-bottom-scrim { background: linear-gradient(to top, ${p.bg100}, transparent) !important; }
`;
}

const claudeCodeAdapter: PlatformAdapter = {
  id: 'claude-code',
  selectors: {
    conversationItem: '[data-epitaxy-entry]',
    messageContainer: '[data-testid="epitaxy-virtual-transcript"]',
  },
  messageRootSelector: '[data-epitaxy-entry]',
  conversationIdPattern: /\/code\/([^/]+)/,
  pinnedMarginSelectors: ['main.dframe-content'],

  getMessageRole(root: Element): 'user' | 'assistant' | null {
    // User messages contain an element with the user-message-background class
    if (root.querySelector('[class*="ui-user-message-background"]')) {
      return 'user';
    }
    // Assistant messages contain epitaxy-markdown content
    if (root.querySelector('.epitaxy-markdown')) {
      return 'assistant';
    }
    // Fallback: check the data-epitaxy-entry value format
    const entryId = root.getAttribute('data-epitaxy-entry');
    if (entryId) {
      if (entryId.startsWith('msg_')) return 'assistant';
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-/.test(entryId)) return 'user';
    }
    return null;
  },

  parseMessageRoot(root: Element): Message | null {
    const text = root.textContent?.trim();
    if (!text) return null;

    const id = getStableRootId(root);
    const role = this.getMessageRole(root);
    if (!role) return null;

    if (role === 'user') {
      const bubble =
        root.querySelector('[class*="ui-user-message-background"]') || root;
      const structured = extractStructuredContent(bubble);
      return {
        id,
        type: 'user',
        text,
        element: root,
        ...(structured.blocks.length > 0 && { structured }),
      };
    }

    // Assistant: collect content from .epitaxy-markdown elements
    const allBlocks: ContentBlock[] = [];
    const textParts: string[] = [];

    const markdownSections = root.querySelectorAll('.epitaxy-markdown');
    for (const section of markdownSections) {
      const t = section.textContent?.trim();
      if (t) textParts.push(t);
      const { blocks } = extractStructuredContent(section);
      allBlocks.push(...blocks);
    }

    const fullText = textParts.join('\n') || text;
    return {
      id,
      type: 'assistant',
      text: fullText,
      element: root,
      structured: { blocks: allBlocks },
    };
  },

  computeSignature(root: Element): string {
    const role = this.getMessageRole(root) || 'unknown';
    return computeBaseSignature(role, root);
  },

  themeCSS(scope, palette, scheme) {
    return claudeCodeThemeCSS(scope, palette, scheme);
  },

  applyThemeSideEffects(theme) {
    syncPageDataMode(theme);
    syncCodeBlockStyles(theme);
  },
};

registerAdapter(claudeCodeAdapter);
