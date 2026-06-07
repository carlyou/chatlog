# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] — 2026-05-30

### Changed

- **Independent preferences per platform.** Theme, glass, font, font
  size, display mode, sidebar pin state, and sidebar width are now
  stored per-platform (`chatlog-theme:claude`, `chatlog-theme:claude-
  code`, `chatlog-theme:chatgpt`, etc.) instead of shared across the
  whole extension — so e.g. a dark theme on claude.ai/code doesn't
  follow you to claude.ai/chat. Existing users keep their current
  values via a one-time fallback read from the legacy shared key.

## [1.5.0] — 2026-05-30

### Added

- **More font choices.** The Font picker is now grouped by Sans-serif /
  Serif / Monospace and ships with Inter, Lato, Roboto, Charter,
  JetBrains Mono, Fira Code, Cascadia Code, IBM Plex Mono, Source Code
  Pro, and Consolas in addition to the previous list. Each entry uses
  a sensible fallback stack so the choice degrades gracefully on
  systems where the named face isn't installed.
- **Font size scaling.** New Font-size control in shortcut settings — a
  number input flanked by − / + buttons that step in 10% increments,
  bounded to [50%, 300%]. Applied via CSS `zoom` on the platform's
  message-content container so every length scales uniformly (not just
  rem-based typography).

### Fixed

- **Icon-font glyphs rendering as empty rectangles when a custom font
  was chosen.** claude.ai/code marks icon-bearing spans with an inline
  `font-family: var(--font-anthropicons, Anthropicons-Variable)` (often
  via `data-cds="Icon"`). The previous font override used `!important`
  on `span` and `button` selectors, which clobbered those inline styles
  so the private-use-area glyphs missed their font and rendered as
  rectangles. The override now skips elements with `data-cds="Icon"` or
  an inline `font-family` referencing Anthropicons.

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
