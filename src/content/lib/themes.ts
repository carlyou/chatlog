export type ThemeId =
  | 'system'
  | 'tokyo-night'
  | 'nord'
  | 'catppuccin'
  | 'dracula'
  | 'solarized-dark';

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
];

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
  },
};

/**
 * Build host-page CSS for a given theme.
 *
 * Claude.ai uses Tailwind utility classes (bg-bg-100, text-text-200, etc.)
 * which may compile to static color values. We override both the utility classes
 * AND common CSS variable naming conventions to cover all cases.
 */
export function buildHostCSS(themeId: Exclude<ThemeId, 'system'>): string {
  const p = PALETTES[themeId];
  const s = `html[data-chatlog-theme="${themeId}"]`;

  return `
/* === Theme: ${themeId} === */

/* CSS custom properties — covers Tailwind v4 and other variable-based systems */
${s} {
  color-scheme: dark;
  --color-bg-100: ${p.bg100}; --color-bg-200: ${p.bg200}; --color-bg-300: ${p.bg300};
  --color-bg-400: ${p.bg400}; --color-bg-500: ${p.bg500};
  --color-text-100: ${p.text100}; --color-text-200: ${p.text200}; --color-text-300: ${p.text300};
  --color-text-400: ${p.text400}; --color-text-500: ${p.text500};
  --color-border-100: ${p.border100}; --color-border-200: ${p.border200}; --color-border-300: ${p.border300};
  --color-accent-main-100: ${p.accent}; --color-accent-secondary-100: ${p.accent};
  --bg-100: ${p.bg100}; --bg-200: ${p.bg200}; --bg-300: ${p.bg300};
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
${s} [class*="bg-bg-100"] { background-color: ${p.bg100} !important; }
${s} [class*="bg-bg-200"] { background-color: ${p.bg200} !important; }
${s} [class*="bg-bg-300"] { background-color: ${p.bg300} !important; }
${s} [class*="bg-bg-400"] { background-color: ${p.bg400} !important; }
${s} [class*="bg-bg-500"] { background-color: ${p.bg500} !important; }

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

/* Common white/light background utility classes */
${s} [class*="bg-white"] { background-color: ${p.bg100} !important; }
${s} .bg-\\[\\#fff\\], ${s} .bg-\\[\\#ffffff\\] { background-color: ${p.bg100} !important; }

/* Known container overrides */
${s} #main-content,
${s} .root,
${s} main {
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

/* Content typography — headings, bold, links, lists, code */
${s} h1, ${s} h2, ${s} h3, ${s} h4, ${s} h5, ${s} h6 {
  color: ${p.text100} !important;
}
${s} strong, ${s} b {
  color: ${p.text100} !important;
}
${s} a {
  color: ${p.accent} !important;
}
${s} a:hover {
  color: ${p.accentHover} !important;
}
${s} p, ${s} li, ${s} td, ${s} th, ${s} span, ${s} div {
  color: inherit;
}
${s} code:not(pre code) {
  color: ${p.accent} !important;
  background-color: ${p.bg300} !important;
}
${s} pre, ${s} pre code {
  background-color: ${p.bg200} !important;
  color: ${p.text200} !important;
}
${s} blockquote {
  border-left-color: ${p.accent} !important;
  color: ${p.text300} !important;
}
${s} hr {
  border-color: ${p.border200} !important;
}
${s} mark {
  background-color: ${p.bg400} !important;
  color: ${p.text100} !important;
}
${s} ::selection {
  background-color: ${p.accent} !important;
  color: ${p.bg100} !important;
}
${s} ul, ${s} ol {
  color: ${p.text200} !important;
}
${s} li::marker {
  color: ${p.text400} !important;
}
${s} table {
  border-color: ${p.border200} !important;
}
${s} th {
  background-color: ${p.bg300} !important;
  color: ${p.text100} !important;
}
${s} td {
  border-color: ${p.border100} !important;
}

/* ChatGPT specific */
${s} .dark\\:bg-token-main-surface-primary { background-color: ${p.bg100} !important; }
${s} .dark\\:bg-token-main-surface-secondary { background-color: ${p.bg200} !important; }
`;
}

export function getHostCSS(themeId: ThemeId): string {
  if (themeId === 'system') return '';
  return buildHostCSS(themeId);
}
