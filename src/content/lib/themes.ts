export type ThemeId =
  | 'system'
  | 'tokyo-night'
  | 'nord'
  | 'catppuccin'
  | 'dracula'
  | 'solarized-dark'
  | 'rose-pine-dawn'
  | 'solarized-light';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
}

export const THEMES: ThemeMeta[] = [
  { id: 'system', name: 'System' },
  { id: 'tokyo-night', name: 'Tokyo Night' },
  { id: 'nord', name: 'Nord' },
  { id: 'catppuccin', name: 'Catppuccin Mocha' },
  { id: 'dracula', name: 'Dracula' },
  { id: 'solarized-dark', name: 'Solarized Dark' },
  { id: 'rose-pine-dawn', name: 'Rosé Pine Dawn' },
  { id: 'solarized-light', name: 'Solarized Light' },
];

const LIGHT_THEMES: ReadonlySet<string> = new Set([
  'rose-pine-dawn',
  'solarized-light',
]);

export function isLightTheme(id: ThemeId): boolean {
  return LIGHT_THEMES.has(id);
}

export interface ThemePalette {
  bg100: string;
  bg200: string;
  bg300: string;
  bg400: string;
  bg500: string;
  text100: string;
  text200: string;
  text300: string;
  text400: string;
  text500: string;
  border100: string;
  border200: string;
  border300: string;
  accent: string;
  accentHover: string;
  green: string;
  yellow: string;
  purple: string;
  cyan: string;
}

export const PALETTES: Record<Exclude<ThemeId, 'system'>, ThemePalette> = {
  'tokyo-night': {
    bg100: '#1a1b26',
    bg200: '#16161e',
    bg300: '#1f2030',
    bg400: '#292e42',
    bg500: '#24283b',
    text100: '#c0caf5',
    text200: '#a9b1d6',
    text300: '#9aa5ce',
    text400: '#737aa2',
    text500: '#565f89',
    border100: '#1f2030',
    border200: '#292e42',
    border300: '#3b4261',
    accent: '#7aa2f7',
    accentHover: '#6690e0',
    green: '#9ece6a',
    yellow: '#e0af68',
    purple: '#bb9af7',
    cyan: '#7dcfff',
  },
  nord: {
    bg100: '#2e3440',
    bg200: '#292e39',
    bg300: '#3b4252',
    bg400: '#434c5e',
    bg500: '#4c566a',
    text100: '#eceff4',
    text200: '#d8dee9',
    text300: '#c8ced9',
    text400: '#a5b0c1',
    text500: '#7b88a1',
    border100: '#3b4252',
    border200: '#434c5e',
    border300: '#4c566a',
    accent: '#88c0d0',
    accentHover: '#7ab0c0',
    green: '#a3be8c',
    yellow: '#ebcb8b',
    purple: '#b48ead',
    cyan: '#8fbcbb',
  },
  catppuccin: {
    bg100: '#1e1e2e',
    bg200: '#181825',
    bg300: '#313244',
    bg400: '#45475a',
    bg500: '#585b70',
    text100: '#cdd6f4',
    text200: '#bac2de',
    text300: '#a6adc8',
    text400: '#7f849c',
    text500: '#6c7086',
    border100: '#313244',
    border200: '#45475a',
    border300: '#585b70',
    accent: '#89b4fa',
    accentHover: '#74a8f0',
    green: '#a6e3a1',
    yellow: '#f9e2af',
    purple: '#cba6f7',
    cyan: '#94e2d5',
  },
  dracula: {
    bg100: '#282a36',
    bg200: '#21222c',
    bg300: '#343746',
    bg400: '#3e4154',
    bg500: '#44475a',
    text100: '#f8f8f2',
    text200: '#e2e2dc',
    text300: '#bfbfb9',
    text400: '#8b8f9e',
    text500: '#6272a4',
    border100: '#343746',
    border200: '#44475a',
    border300: '#535680',
    accent: '#bd93f9',
    accentHover: '#a87de8',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    purple: '#ff79c6',
    cyan: '#8be9fd',
  },
  'solarized-dark': {
    bg100: '#002b36',
    bg200: '#00212b',
    bg300: '#073642',
    bg400: '#0a4050',
    bg500: '#1a5060',
    text100: '#fdf6e3',
    text200: '#eee8d5',
    text300: '#d3cbbf',
    text400: '#93a1a1',
    text500: '#839496',
    border100: '#073642',
    border200: '#0a4050',
    border300: '#586e75',
    accent: '#268bd2',
    accentHover: '#1e7abe',
    green: '#859900',
    yellow: '#b58900',
    purple: '#6c71c4',
    cyan: '#2aa198',
  },
  'rose-pine-dawn': {
    bg100: '#faf4ed',
    bg200: '#fffaf3',
    bg300: '#f2e9e1',
    bg400: '#dfdad9',
    bg500: '#cecacd',
    text100: '#575279',
    text200: '#797593',
    text300: '#9893a5',
    text400: '#b4b0be',
    text500: '#cecacd',
    border100: '#f2e9e1',
    border200: '#dfdad9',
    border300: '#cecacd',
    accent: '#907aa9',
    accentHover: '#7d6899',
    green: '#286983',
    yellow: '#ea9d34',
    purple: '#907aa9',
    cyan: '#56949f',
  },
  'solarized-light': {
    bg100: '#fdf6e3',
    bg200: '#eee8d5',
    bg300: '#e6dfcb',
    bg400: '#ddd6c1',
    bg500: '#d5cdb7',
    text100: '#657b83',
    text200: '#586e75',
    text300: '#839496',
    text400: '#93a1a1',
    text500: '#a8b4b4',
    border100: '#eee8d5',
    border200: '#ddd6c1',
    border300: '#ccc5af',
    accent: '#268bd2',
    accentHover: '#1e7abe',
    green: '#859900',
    yellow: '#b58900',
    purple: '#6c71c4',
    cyan: '#2aa198',
  },
};

/**
 * Build host-page CSS for a given theme.
 *
 * Claude.ai uses Tailwind utility classes (bg-bg-100, text-text-200, etc.)
 * which may compile to static color values. We override both the utility classes
 * AND common CSS variable naming conventions to cover all cases.
 */
export function buildHostCSS(themeId: Exclude<ThemeId, 'system'>, platform?: string): string {
  const p = PALETTES[themeId];
  const s = `html[data-chatlog-theme="${themeId}"]`;

  const scheme = isLightTheme(themeId) ? 'light' : 'dark';

  return `
/* === Theme: ${themeId} === */

/* CSS custom properties — covers Tailwind v4 and other variable-based systems */
${s} {
  color-scheme: ${scheme} !important;
  --color-bg-000: ${p.bg200}; --color-bg-100: ${p.bg100}; --color-bg-200: ${p.bg200}; --color-bg-300: ${p.bg300};
  --color-bg-400: ${p.bg400}; --color-bg-500: ${p.bg500};
  --color-text-100: ${p.text100}; --color-text-200: ${p.text200}; --color-text-300: ${p.text300};
  --color-text-400: ${p.text400}; --color-text-500: ${p.text500};
  --color-border-100: ${p.border100}; --color-border-200: ${p.border200}; --color-border-300: ${p.border300};
  --color-accent-main-100: ${p.accent}; --color-accent-secondary-100: ${p.accent};
  --bg-000: ${p.bg200}; --bg-100: ${p.bg100}; --bg-200: ${p.bg200}; --bg-300: ${p.bg300};
  --text-100: ${p.text100}; --text-200: ${p.text200}; --text-300: ${p.text300};
  --main-surface-primary: ${p.bg100}; --main-surface-secondary: ${p.bg200};
  --main-surface-tertiary: ${p.bg300};
  --text-primary: ${p.text100}; --text-secondary: ${p.text200};
  --sidebar-surface-primary: ${p.bg200}; --sidebar-surface-secondary: ${p.bg100};
}

/* Root & body */
${s}, ${s} body {
  background-color: ${p.bg100} !important;
  color: ${p.text100} !important;
}

/* Tailwind bg-bg-* utility class overrides (Claude.ai) */
${s} [class*="bg-bg-000"] { background-color: ${p.bg200} !important; }
${s} [class*="bg-bg-100"] { background-color: ${p.bg100} !important; }
${s} [class*="bg-bg-200"] { background-color: ${p.bg200} !important; }
${s} [class*="bg-bg-300"] { background-color: ${p.bg300} !important; }
${s} [class*="bg-bg-400"] { background-color: ${p.bg400} !important; }
${s} [class*="bg-bg-500"] { background-color: ${p.bg500} !important; }
${platform === 'claude-code' ? `
/* Claude Code: strip bg from sidebar items & thinking blocks, keep user bubbles */
${s} [class*="bg-bg-200"]:not([class*="text-text-000"]) { background-color: transparent !important; }
${s} .group[class*="bg-bg-300"] { background-color: transparent !important; }
/* Hover: restore theme bg for bg-bg-200 and bg-bg-300 items */
${s} [class*="hover\\:bg-bg-200"]:hover,
${s} [class*="bg-bg-200"]:not([class*="text-text-000"]):hover { background-color: ${p.bg300} !important; }
${s} .group[class*="bg-bg-300"]:hover { background-color: ${p.bg300} !important; }
/* User message bubble — keep visible */
${s} [class*="bg-bg-200"][class*="text-text-000"] { background-color: ${p.bg400} !important; }
/* Sidebar session hover gradient overlay */
${s} .group:hover [style*="linear-gradient"] { background: linear-gradient(to right, transparent, ${p.bg300} 40%) !important; }
` : ''}

/* Buttons — override white backgrounds in content area, keep nav/sidebar buttons natural */
${s} #main-content button:not([class*="bg-accent"]),
${s} main button:not([class*="bg-accent"]) { background-color: ${p.bg300} !important; color: ${p.text200} !important; }
${s} #main-content button:hover:not([class*="bg-accent"]),
${s} main button:hover:not([class*="bg-accent"]) { background-color: ${p.bg400} !important; }
/* Thinking status button — blend with parent */
${s} #main-content button.group\\/status,
${s} main button.group\\/status { background-color: transparent !important; }

/* Tailwind text-text-* utility class overrides */
${s} [class*="text-text-100"] { color: ${p.text100} !important; }
${s} [class*="text-text-200"] { color: ${p.text200} !important; }
${s} [class*="text-text-300"] { color: ${p.text300} !important; }
${s} [class*="text-text-400"] { color: ${p.text400} !important; }
${s} [class*="text-text-500"] { color: ${p.text500} !important; }

/* Tailwind border-border-* utility class overrides */
${s} [class*="border-border-100"] { border-color: ${p.border100} !important; }
${s} [class*="border-border-200"] { border-color: ${p.border200} !important; }
${s} [class*="border-border-300"] { border-color: ${p.border300} !important; }

/* Tailwind accent / highlight classes */
${s} [class*="bg-accent-main-100"] { background-color: ${p.accent} !important; }
${s} [class*="text-accent-main-100"] { color: ${p.accent} !important; }

/* ── Light-mode leak overrides ──
   When OS is in light mode, the host page loads light-colored Tailwind utility
   classes and arbitrary-value classes that aren't covered by CSS variable
   overrides. Catch them broadly here. */
${s} [class*="bg-white"] { background-color: ${p.bg100} !important; }
${s} .bg-\\[\\#fff\\], ${s} .bg-\\[\\#ffffff\\] { background-color: ${p.bg100} !important; }
${s} [class*="bg-stone"] { background-color: ${p.bg100} !important; }
${s} [class*="bg-gray"] { background-color: ${p.bg100} !important; }
${s} [class*="bg-neutral"] { background-color: ${p.bg100} !important; }
${s} [class*="bg-zinc"] { background-color: ${p.bg100} !important; }
${s} [class*="bg-slate"] { background-color: ${p.bg100} !important; }
${s} [class*="bg-[#f"]:not(pre):not(code):not(button):not([role="button"]) { background-color: ${p.bg100} !important; }
${s} [class*="bg-[#F"]:not(pre):not(code):not(button):not([role="button"]) { background-color: ${p.bg100} !important; }
${s} [class*="bg-[#e"]:not(pre):not(code):not(button):not([role="button"]) { background-color: ${p.bg100} !important; }
${s} [class*="bg-[#E"]:not(pre):not(code):not(button):not([role="button"]) { background-color: ${p.bg100} !important; }
${s} [class*="bg-[#d"]:not(pre):not(code):not(button):not([role="button"]) { background-color: ${p.bg100} !important; }
${s} [class*="bg-[#D"]:not(pre):not(code):not(button):not([role="button"]) { background-color: ${p.bg100} !important; }
${s} [class*="text-black"] { color: ${p.text100} !important; }
${s} [class*="text-stone"] { color: ${p.text100} !important; }
${s} [class*="text-gray"] { color: ${p.text100} !important; }
${s} [class*="text-neutral"] { color: ${p.text100} !important; }
${s} [class*="text-zinc"] { color: ${p.text100} !important; }
${s} [class*="text-slate"] { color: ${p.text100} !important; }
${s} [class*="border-stone"] { border-color: ${p.border200} !important; }
${s} [class*="border-gray"] { border-color: ${p.border200} !important; }
${s} [class*="border-neutral"] { border-color: ${p.border200} !important; }
${s} [class*="border-zinc"] { border-color: ${p.border200} !important; }
${s} [class*="border-slate"] { border-color: ${p.border200} !important; }

/* Kill light-mode compiled gradients on any element */
${s} [class*="bg-gradient"] { background-image: none !important; }

/* Known container overrides */
${s} #main-content,
${s} .root,
${s} main,
${s} header {
  background-color: ${p.bg100} !important;
  color: ${p.text100} !important;
}

/* App root wrappers — catch nested React mount divs that cover the viewport */
${s} body > div:not(#chatlog-root),
${s} body > div:not(#chatlog-root) > div,
${s} body > div:not(#chatlog-root) > div > div,
${s} body > div:not(#chatlog-root) > div > div > div {
  background-color: transparent !important;
}

/* Sidebar / nav: force dark bg, kill light-mode gradients, fix link colors */
${s} nav, ${s} aside { background-color: ${p.bg200} !important; background-image: none !important; color: ${p.text200} !important; }
${s} nav a, ${s} aside a { color: ${p.text200} !important; }
${s} nav a:hover, ${s} aside a:hover { color: ${p.text100} !important; }

/* ── Content typography — rich syntax highlighting ── */

/* Heading hierarchy: each level gets a distinct theme color.
   Uses doubled attribute selector to beat text-text-* utility overrides
   (specificity 0,2,2 vs 0,2,1). */
${s}[data-chatlog-theme] h1 { color: ${p.accent} !important; }
${s}[data-chatlog-theme] h2 { color: ${p.purple} !important; }
${s}[data-chatlog-theme] h3 { color: ${p.cyan} !important; }
${s}[data-chatlog-theme] h4 { color: ${p.green} !important; }
${s}[data-chatlog-theme] h5, ${s}[data-chatlog-theme] h6 { color: ${p.text200} !important; }

/* Emphasis — also needs specificity boost */
${s}[data-chatlog-theme] strong, ${s}[data-chatlog-theme] b { color: ${p.yellow} !important; }
${s}[data-chatlog-theme] em, ${s}[data-chatlog-theme] i { color: ${p.purple} !important; font-style: italic; }

/* Links — only in main content area, not sidebar nav */
${s}[data-chatlog-theme] #main-content a, ${s}[data-chatlog-theme] main a, ${s}[data-chatlog-theme] article a { color: ${p.accent} !important; }
${s}[data-chatlog-theme] #main-content a:hover, ${s}[data-chatlog-theme] main a:hover, ${s}[data-chatlog-theme] article a:hover { color: ${p.accentHover} !important; }

/* Body text inherits */
${s} p, ${s} span, ${s} div { color: inherit; }

/* Lists — colored markers, themed text */
${s} ul, ${s} ol { color: ${p.text200} !important; }
${s} li { color: ${p.text200} !important; }
${s} ul > li::marker { color: ${p.green} !important; }
${s} ol > li::marker { color: ${p.cyan} !important; }

/* Inline code — accent colored with subtle background */
${s} code:not(pre code) {
  color: ${p.green} !important;
  background-color: ${p.bg300} !important;
  border-radius: 4px;
  padding: 1px 5px;
}

/* Code blocks */
${s} pre {
  background-color: ${p.bg200} !important;
  border-radius: 8px !important;
}
${s} pre code {
  color: ${p.text200} !important;
  background-color: transparent !important;
}

/* Blockquote — purple accent bar */
${s} blockquote {
  border-left: 3px solid ${p.purple} !important;
  background-color: ${p.bg300} !important;
  color: ${p.text300} !important;
  padding: 8px 12px !important;
  border-radius: 0 4px 4px 0 !important;
}

/* Horizontal rule */
${s} hr {
  border-color: ${p.border200} !important;
}

/* Selection */
${s} mark {
  background-color: ${p.bg400} !important;
  color: ${p.text100} !important;
}
${s} ::selection {
  background-color: ${p.accent} !important;
  color: ${p.bg100} !important;
}

/* Tables */
${s} table { border-color: ${p.border200} !important; }
${s} th {
  background-color: ${p.bg300} !important;
  color: ${p.accent} !important;
  font-weight: 600;
}
${s} td {
  border-color: ${p.border100} !important;
  color: ${p.text200} !important;
}

/* ── ChatGPT specific ── */

/* ChatGPT token CSS variables */
${s} {
  --token-main-surface-primary: ${p.bg100};
  --token-main-surface-secondary: ${p.bg200};
  --token-main-surface-tertiary: ${p.bg300};
  --token-sidebar-surface-primary: ${p.bg200};
  --token-sidebar-surface-secondary: ${p.bg300};
  --token-text-primary: ${p.text100};
  --token-text-secondary: ${p.text200};
  --token-text-tertiary: ${p.text300};
  --token-text-quaternary: ${p.text400};
  --token-border-medium: ${p.border200};
  --token-border-light: ${p.border100};
  --token-border-heavy: ${p.border300};
  --token-border-xheavy: ${p.border300};
  --main-surface-primary: ${p.bg100};
  --main-surface-secondary: ${p.bg200};
  --main-surface-tertiary: ${p.bg300};
  --sidebar-surface-primary: ${p.bg200};
  --sidebar-surface-secondary: ${p.bg300};
  --sidebar-mask-bg: ${p.bg200};
  --bg-elevated-secondary: ${p.bg200};
  --bg-elevated-primary: ${p.bg300};
}

/* ChatGPT bg-token-* utility overrides */
${s} [class*="bg-token-main-surface-primary"] { background-color: ${p.bg100} !important; }
${s} [class*="bg-token-main-surface-secondary"] { background-color: ${p.bg200} !important; }
${s} [class*="bg-token-main-surface-tertiary"] { background-color: ${p.bg300} !important; }
${s} [class*="bg-token-sidebar-surface-primary"] { background-color: ${p.bg200} !important; }
${s} [class*="bg-token-sidebar-surface-secondary"] { background-color: ${p.bg300} !important; }

/* ChatGPT text-token-* utility overrides */
${s} [class*="text-token-text-primary"] { color: ${p.text100} !important; }
${s} [class*="text-token-text-secondary"] { color: ${p.text200} !important; }
${s} [class*="text-token-text-tertiary"] { color: ${p.text300} !important; }
${s} [class*="text-token-text-quaternary"] { color: ${p.text400} !important; }

/* ChatGPT border-token-* utility overrides */
${s} [class*="border-token-border-medium"] { border-color: ${p.border200} !important; }
${s} [class*="border-token-border-light"] { border-color: ${p.border100} !important; }
${s} [class*="border-token-border-heavy"] { border-color: ${p.border300} !important; }

/* ChatGPT dark: prefixed classes (compiled Tailwind dark mode) */
${s} .dark\\:bg-token-main-surface-primary { background-color: ${p.bg100} !important; }
${s} .dark\\:bg-token-main-surface-secondary { background-color: ${p.bg200} !important; }
${s} .dark\\:bg-token-main-surface-tertiary { background-color: ${p.bg300} !important; }
${s} .dark\\:bg-token-sidebar-surface-primary { background-color: ${p.bg200} !important; }

/* ChatGPT sidebar wrapper divs (not nav/aside but parent containers) */
${s} [class*="bg-token-sidebar"],
${s} [class*="sidebar-width"],
${s} [class*="w-(--sidebar"],
${s} [class*="sidebar-mask"],
${s} [class*="bg-(--sidebar"],
${s} div[class*="border-token-border-light"][class*="shrink-0"] {
  background-color: ${p.bg200} !important;
  background-image: none !important;
}

/* Input areas — covers both Claude and ChatGPT */
${s} textarea,
${s} [contenteditable],
${s} input[type="text"],
${s} [id*="prompt"],
${s} [class*="composer"],
${s} [class*="chat-input"] {
  background-color: ${p.bg300} !important;
  color: ${p.text100} !important;
  border-color: ${p.border200} !important;
}
/* Chat input container — transparent inner elements so only fieldset outline shows */
${s} div[data-chat-input-container="true"] [contenteditable],
${s} div[data-chat-input-container="true"] textarea,
${s} .root textarea,
${s} .root [contenteditable] {
  background-color: transparent !important;
}

/* ChatGPT user message bubble */
${s} .user-message-bubble-color {
  background-color: ${p.bg400} !important;
  color: ${p.text100} !important;
}

/* ChatGPT source citation badges */
${s} a[class*="rounded-xl"][class*="text-token-"] {
  background-color: ${p.bg300} !important;
  color: ${p.text300} !important;
}

/* Footer / bottom bar */
${s} footer { background-color: ${p.bg100} !important; color: ${p.text300} !important; }

/* ChatGPT composer bottom fade — ::after pseudo with white gradient */
${s} #thread-bottom-container::after,
${s} [class*="content-fade"]::after {
  background-image: linear-gradient(transparent, ${p.bg100}) !important;
  background-color: transparent !important;
}
`;
}

export function getHostCSS(themeId: ThemeId, platform?: string): string {
  if (themeId === 'system') return '';
  return buildHostCSS(themeId, platform);
}
