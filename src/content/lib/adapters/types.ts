import type { Message, PlatformSelectors } from '../../../types';
import type { ThemeId, ThemePalette } from '../themes';

export type ThemeScheme = 'light' | 'dark';

export interface PlatformAdapter {
  readonly id: string;
  readonly selectors: PlatformSelectors;
  readonly messageRootSelector: string;
  readonly conversationIdPattern: RegExp;
  readonly pinnedMarginSelectors: string[];

  getMessageRole(root: Element): 'user' | 'assistant' | null;
  parseMessageRoot(root: Element): Message | null;
  computeSignature(root: Element): string;

  /**
   * Optional: a stable identifier for an entry, derived from the host page's
   * own DOM (e.g. claude.ai/code's `data-epitaxy-entry`). When provided,
   * useMessages keeps a persistent cache keyed by this id, so entries that
   * the virtual scroller unmounts still appear in the sidebar. Adapters
   * that don't virtualize can omit this — the hook falls back to its
   * element-keyed cache and surfaces only currently-mounted entries.
   */
  getStableEntryId?(root: Element): string | null;

  /**
   * Returns CSS overrides specific to this platform's DOM. Called once per
   * theme switch. The scope selector (e.g. `html[data-chatlog-theme="..."]`)
   * is already provided so adapters don't have to know it.
   */
  themeCSS(scope: string, palette: ThemePalette, scheme: ThemeScheme): string;

  /**
   * Optional: imperative side-effects per theme change that CSS alone can't
   * express — e.g. flipping the page's own `data-mode` so its built-in
   * dark-mode rules apply. Called with `'system'` on cleanup; the adapter is
   * responsible for restoring whatever it changed.
   */
  applyThemeSideEffects?(theme: ThemeId): void;
}
