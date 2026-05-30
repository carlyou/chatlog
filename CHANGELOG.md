# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] — 2026-05-30

### Added

- **Theme-aware code-block syntax highlighting on claude.ai/code.** Fenced
  blocks now recolor keywords, types, functions, strings, comments, and
  punctuation to the active theme. Works across both light and dark themes
  and picks up newly-mounted blocks as the virtual transcript scrolls.

### Fixed

- **Sidebar overlap on claude.ai/code.** When the ChatLog sidebar was
  pinned, `main.dframe-content` (position: absolute; inset: 0) ignored the
  `margin-right` rule, so the page content sat behind the sidebar.
- **Chat input scroll jump on claude.ai/code.** Revealing the bottom input
  no longer pushes transcript content up — the column is floated over the
  transcript instead of transitioning `max-height`. Reveal/hide is also
  150 ms instead of 300 ms.
- **Page going blank under dark themes on claude.ai/code.** The bg-override
  pass was painting bg100 onto a full-viewport `position: fixed;
  pointer-events: none` overlay (`.epitaxy-root` at z-index 60), occluding
  everything. Skips transparent fixed overlays now.
- **Invisible masked text on claude.ai/code.** The page uses
  `mask-image: linear-gradient(hsl(var(--always-black)), transparent)` on
  truncated text, which resolves as luminance — overriding `--always-black`
  to a near-black palette value erased the text. Set to white for dark
  themes, black for light.
- **Wrong inherited token values inside `.epitaxy-root`.** The element
  re-defines its own `--t1..--t9` scale, so descendants like `.text-t9`
  read the page's light-mode values even with our overrides loaded.
- **Dark Accept-edits button and user message bubble on claude.ai/code.**
  The page builds its semantic tokens (`--text-assistant-primary`,
  `--ui-user-message-primary-text`, fills, surfaces) inside
  `[data-mode="dark"] .epitaxy-root` blocks. Flips `<html data-mode>` in
  lockstep with the active theme so the page's dark-mode rules apply.
- **`/code` welcome page falling back to the wrong adapter.** Routes
  without a session id (`/code` exact) now resolve to the claude-code
  adapter instead of the older claude (`/chat`) one.

### Changed

- **Refactor: platform theme CSS moved onto adapters.** `themes.ts` shrank
  from 779 to 540 lines; the 470-line `buildHostCSS` monolith was replaced
  by `commonThemeCSS` plus an adapter-level `themeCSS(scope, palette,
  scheme)`. ChatGPT's ~100 lines of `--token-*` overrides no longer ship
  to claude pages. The claude-code-specific data-mode flip moved out of
  `useTheme.ts` into the adapter's optional `applyThemeSideEffects` hook.

## [1.3.0] — earlier

- Font selection in shortcut settings; additional light themes.
- Style tweaks: hide input by default; full-width content.
- Support for the new claude.ai/code epitaxy frontend.

## [1.2.0] — earlier

- Override inline syntax-highlight colors in code blocks.
- Restore `*=` selectors for style and id attributes.
- Improve theme CSS overrides; add light themes.

## [1.1.0] — earlier

- Improve UI contrast for user bubbles, chat input, and thinking button.
- Update backgrounds; misc theme fixes and new themes.
- Markdown export support.
- Initial Claude Code platform support.

## [1.0.0] — earlier

- Initial public release: structured sidebar for Claude.ai and ChatGPT
  with outline navigation, scroll sync, branch navigation, and keyboard
  shortcuts.
