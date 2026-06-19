import { getAdapter } from './adapters/registry';

export type ThemeId =
  | 'system'
  | 'tokyo-night'
  | 'nord'
  | 'catppuccin'
  | 'dracula'
  | 'solarized-dark'
  | 'rose-pine-dawn'
  | 'solarized-light'
  | 'catppuccin-latte'
  | 'github-light'
  | 'one-light'
  | 'gruvbox-light'
  | 'ayu-light'
  | 'alucard'
  | 'everforest-light';

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
  { id: 'catppuccin-latte', name: 'Catppuccin Latte' },
  { id: 'github-light', name: 'GitHub Light' },
  { id: 'one-light', name: 'One Light' },
  { id: 'gruvbox-light', name: 'Gruvbox Light' },
  { id: 'ayu-light', name: 'Ayu Light' },
  { id: 'alucard', name: 'Alucard (Dracula Light)' },
  { id: 'everforest-light', name: 'Everforest Light' },
];

const LIGHT_THEMES: ReadonlySet<string> = new Set([
  'rose-pine-dawn',
  'solarized-light',
  'catppuccin-latte',
  'github-light',
  'one-light',
  'gruvbox-light',
  'ayu-light',
  'alucard',
  'everforest-light',
]);

export function isLightTheme(id: ThemeId): boolean {
  return LIGHT_THEMES.has(id);
}

/**
 * Themes split into "System" / "Light" / "Dark" sections, alphabetised by
 * name within each, for rendering as <optgroup>s in the picker. `system` is
 * neither light nor dark, so it gets its own leading section.
 */
export function groupedThemes(): Array<{ group: string; themes: ThemeMeta[] }> {
  const byName = (a: ThemeMeta, b: ThemeMeta) => a.name.localeCompare(b.name);
  const named = THEMES.filter((t) => t.id !== 'system');
  return [
    { group: 'System', themes: THEMES.filter((t) => t.id === 'system') },
    {
      group: 'Light',
      themes: named.filter((t) => isLightTheme(t.id)).sort(byName),
    },
    {
      group: 'Dark',
      themes: named.filter((t) => !isLightTheme(t.id)).sort(byName),
    },
  ];
}

export interface ThemePalette {
  bg000: string;
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
    bg000: '#13131d',
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
    bg000: '#242933',
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
    bg000: '#11111b',
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
    bg000: '#1d1e26',
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
    bg000: '#001b22',
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
    bg000: '#fffcf7',
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
    bg000: '#fffdf5',
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
  'catppuccin-latte': {
    bg000: '#f5f7fb',
    bg100: '#eff1f5',
    bg200: '#e6e9ef',
    bg300: '#dce0e8',
    bg400: '#ccd0da',
    bg500: '#bcc0cc',
    text100: '#4c4f69',
    text200: '#5c5f77',
    text300: '#6c6f85',
    text400: '#8c8fa1',
    text500: '#9ca0b0',
    border100: '#dce0e8',
    border200: '#ccd0da',
    border300: '#bcc0cc',
    accent: '#1e66f5',
    accentHover: '#1a5ae0',
    green: '#40a02b',
    yellow: '#df8e1d',
    purple: '#8839ef',
    cyan: '#179299',
  },
  'github-light': {
    bg000: '#ffffff',
    bg100: '#ffffff',
    bg200: '#f6f8fa',
    bg300: '#eaeef2',
    bg400: '#d1d9e0',
    bg500: '#afb8c1',
    text100: '#1f2328',
    text200: '#31363b',
    text300: '#656d76',
    text400: '#818b98',
    text500: '#afb8c1',
    border100: '#eaeef2',
    border200: '#d1d9e0',
    border300: '#b4bcc6',
    accent: '#0969da',
    accentHover: '#0757b8',
    green: '#1a7f37',
    yellow: '#9a6700',
    purple: '#8250df',
    cyan: '#0550ae',
  },
  'one-light': {
    bg000: '#fefefe',
    bg100: '#fafafa',
    bg200: '#f0f0f0',
    bg300: '#e5e5e6',
    bg400: '#d5d5d6',
    bg500: '#c5c5c6',
    text100: '#383a42',
    text200: '#4f525e',
    text300: '#696c77',
    text400: '#a0a1a7',
    text500: '#b4b5ba',
    border100: '#e5e5e6',
    border200: '#d5d5d6',
    border300: '#c5c5c6',
    accent: '#4078f2',
    accentHover: '#3569db',
    green: '#50a14f',
    yellow: '#c18401',
    purple: '#a626a4',
    cyan: '#0184bc',
  },
  'gruvbox-light': {
    bg000: '#fbf1c7',
    bg100: '#fbf1c7',
    bg200: '#f2e5bc',
    bg300: '#ebdbb2',
    bg400: '#d5c4a1',
    bg500: '#bdae93',
    text100: '#3c3836',
    text200: '#504945',
    text300: '#665c54',
    text400: '#7c6f64',
    text500: '#928374',
    border100: '#ebdbb2',
    border200: '#d5c4a1',
    border300: '#bdae93',
    accent: '#076678',
    accentHover: '#055b6a',
    green: '#79740e',
    yellow: '#b57614',
    purple: '#8f3f71',
    cyan: '#427b58',
  },
  'ayu-light': {
    bg000: '#fcfcfc',
    bg100: '#fafafa',
    bg200: '#f0ede6',
    bg300: '#e7e3dc',
    bg400: '#d8d4cd',
    bg500: '#c9c5be',
    text100: '#5c6166',
    text200: '#6b7178',
    text300: '#8b9198',
    text400: '#a3a8ae',
    text500: '#b8bcc2',
    border100: '#e7e3dc',
    border200: '#d8d4cd',
    border300: '#c9c5be',
    accent: '#399ee6',
    accentHover: '#2d8ad0',
    green: '#86b300',
    yellow: '#f2ae49',
    purple: '#a37acc',
    cyan: '#4cbf99',
  },
  // Alucard — the official light variant of Dracula.
  // https://github.com/dracula/dracula-theme
  alucard: {
    bg000: '#fffefa',
    bg100: '#fffbeb',
    bg200: '#f7f2df',
    bg300: '#efe9d2',
    bg400: '#e2dcc4',
    bg500: '#ccc6ad',
    text100: '#1f1f1f',
    text200: '#3a3730',
    text300: '#6c664b',
    text400: '#8a8467',
    text500: '#aaa488',
    border100: '#efe9d2',
    border200: '#e2dcc4',
    border300: '#ccc6ad',
    accent: '#644ac9',
    accentHover: '#5339b0',
    green: '#14710a',
    yellow: '#846e15',
    purple: '#644ac9',
    cyan: '#036a96',
  },
  // Everforest — light medium variant.
  // https://github.com/sainnhe/everforest
  'everforest-light': {
    bg000: '#fffbef',
    bg100: '#fdf6e3',
    bg200: '#f4f0d9',
    bg300: '#efebd4',
    bg400: '#e6e2cc',
    bg500: '#d5d0b8',
    text100: '#4e565c',
    text200: '#5c6a72',
    text300: '#829181',
    text400: '#939f91',
    text500: '#a6b0a0',
    border100: '#efebd4',
    border200: '#e6e2cc',
    border300: '#d5d0b8',
    accent: '#8da101',
    accentHover: '#798a00',
    green: '#8da101',
    yellow: '#dfa000',
    purple: '#df69ba',
    cyan: '#35a77c',
  },
};

/**
 * Convert a hex color (#rrggbb) to space-separated HSL components
 * (e.g. "220 13% 18%") for use in CSS variables consumed via hsl().
 */
export function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return `0 0% ${Math.round(l * 100)}%`;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Generate selector overrides for a Tailwind utility class.
 * Covers: exact token (~=), opacity variant (/50), and ! prefix.
 * Hover/active/gradient variants are handled by CSS variable overrides
 * (with !important) so they don't need explicit selectors.
 */
export function twOverride(
  scope: string,
  cls: string,
  prop: string,
  value: string,
): string {
  return `${scope} [class~="${cls}"], ${scope} [class*="${cls}/"], ${scope} [class~="\\!${cls}"], ${scope} [class*="\\!${cls}/"] { ${prop}: ${value} !important; }`;
}

/**
 * Generic CSS that applies to every supported platform. Sets up the design-
 * token-style CSS variables (covering common Tailwind / token naming
 * conventions), Tailwind utility-class overrides for the bg/text/border
 * palette, content typography, and the light-mode-leak heuristics that catch
 * Tailwind utilities compiled to static color values.
 *
 * Platform-specific rules live on the adapters via `themeCSS()`.
 */
function commonThemeCSS(
  s: string,
  p: ThemePalette,
  scheme: 'light' | 'dark',
): string {
  return `
${s} {
  color-scheme: ${scheme} !important;
  --color-bg-000: ${p.bg000} !important; --color-bg-100: ${p.bg100} !important; --color-bg-200: ${p.bg200} !important; --color-bg-300: ${p.bg300} !important;
  --color-bg-400: ${p.bg400} !important; --color-bg-500: ${p.bg500} !important;
  --color-text-100: ${p.text100} !important; --color-text-200: ${p.text200} !important; --color-text-300: ${p.text300} !important;
  --color-text-400: ${p.text400} !important; --color-text-500: ${p.text500} !important;
  --color-border-100: ${p.border100} !important; --color-border-200: ${p.border200} !important; --color-border-300: ${p.border300} !important;
  --color-accent-main-100: ${p.accent} !important; --color-accent-secondary-100: ${p.accent} !important;
  --bg-000: ${hexToHsl(p.bg000)} !important; --bg-100: ${hexToHsl(p.bg100)} !important; --bg-200: ${hexToHsl(p.bg200)} !important; --bg-300: ${hexToHsl(p.bg300)} !important;
  --bg-400: ${hexToHsl(p.bg400)} !important; --bg-500: ${hexToHsl(p.bg500)} !important;
  --text-100: ${hexToHsl(p.text100)} !important; --text-200: ${hexToHsl(p.text200)} !important; --text-300: ${hexToHsl(p.text300)} !important;
  --text-400: ${hexToHsl(p.text400)} !important; --text-500: ${hexToHsl(p.text500)} !important;
  --border-100: ${hexToHsl(p.border100)} !important; --border-200: ${hexToHsl(p.border200)} !important; --border-300: ${hexToHsl(p.border300)} !important;
  --main-surface-primary: ${p.bg100} !important; --main-surface-secondary: ${p.bg200} !important;
  --main-surface-tertiary: ${p.bg300} !important;
  --text-primary: ${p.text100} !important; --text-secondary: ${p.text200} !important;
  --sidebar-surface-primary: ${p.bg200} !important; --sidebar-surface-secondary: ${p.bg100} !important;
}

${s}, ${s} body {
  background-color: ${p.bg100} !important;
  color: ${p.text100} !important;
}

${twOverride(s, 'bg-bg-000', 'background-color', p.bg000)}
${twOverride(s, 'bg-bg-100', 'background-color', p.bg100)}
${twOverride(s, 'bg-bg-200', 'background-color', p.bg200)}
${twOverride(s, 'bg-bg-300', 'background-color', p.bg300)}
${twOverride(s, 'bg-bg-400', 'background-color', p.bg400)}
${twOverride(s, 'bg-bg-500', 'background-color', p.bg500)}
${twOverride(s, 'text-text-100', 'color', p.text100)}
${twOverride(s, 'text-text-200', 'color', p.text200)}
${twOverride(s, 'text-text-300', 'color', p.text300)}
${twOverride(s, 'text-text-400', 'color', p.text400)}
${twOverride(s, 'text-text-500', 'color', p.text500)}
${twOverride(s, 'border-border-100', 'border-color', p.border100)}
${twOverride(s, 'border-border-200', 'border-color', p.border200)}
${twOverride(s, 'border-border-300', 'border-color', p.border300)}
${s} [class~="bg-accent-main-100"] { background-color: ${p.accent} !important; }
${s} [class~="text-accent-main-100"] { color: ${p.accent} !important; }

/* Light-mode-leak overrides: Tailwind utilities that compile to static
   color values and aren't covered by the design-token vars above. */
${s} [class~="bg-white"] { background-color: ${p.bg100} !important; }
${s} .bg-\\[\\#fff\\], ${s} .bg-\\[\\#ffffff\\] { background-color: ${p.bg100} !important; }
${s} [class*="bg-stone-"], ${s} [class*="bg-gray-"], ${s} [class*="bg-neutral-"], ${s} [class*="bg-zinc-"], ${s} [class*="bg-slate-"] { background-color: ${p.bg100} !important; }
${s} [class*="bg-[#f"]:not(pre):not(code):not(button):not([role="button"]),
${s} [class*="bg-[#F"]:not(pre):not(code):not(button):not([role="button"]),
${s} [class*="bg-[#e"]:not(pre):not(code):not(button):not([role="button"]),
${s} [class*="bg-[#E"]:not(pre):not(code):not(button):not([role="button"]),
${s} [class*="bg-[#d"]:not(pre):not(code):not(button):not([role="button"]),
${s} [class*="bg-[#D"]:not(pre):not(code):not(button):not([role="button"]) { background-color: ${p.bg100} !important; }
${s} [class~="text-black"], ${s} [class*="text-stone-"], ${s} [class*="text-gray-"], ${s} [class*="text-neutral-"], ${s} [class*="text-zinc-"], ${s} [class*="text-slate-"] { color: ${p.text100} !important; }
${s} [class*="border-stone-"], ${s} [class*="border-gray-"], ${s} [class*="border-neutral-"], ${s} [class*="border-zinc-"], ${s} [class*="border-slate-"] { border-color: ${p.border200} !important; }

/* Container & app-root wrappers */
${s} #main-content, ${s} .root, ${s} main, ${s} header {
  background-color: ${p.bg100} !important;
  color: ${p.text100} !important;
}
${s} body > div:not(#chatlog-root),
${s} body > div:not(#chatlog-root) > div,
${s} body > div:not(#chatlog-root) > div > div,
${s} body > div:not(#chatlog-root) > div > div > div {
  background-color: transparent !important;
}

/* Nav / sidebar */
${s} nav, ${s} aside { background-color: ${p.bg200} !important; background-image: none !important; color: ${p.text200} !important; }
${s} nav a, ${s} aside a { color: ${p.text200} !important; }
${s} nav a:hover, ${s} aside a:hover { color: ${p.text100} !important; background-color: ${p.bg300} !important; }

/* Content typography */
/* Doubled-attribute selectors give specificity (0,2,2), beating the
   text-text-* utility overrides above. */
${s}[data-chatlog-theme] h1 { color: ${p.accent} !important; }
${s}[data-chatlog-theme] h2 { color: ${p.purple} !important; }
${s}[data-chatlog-theme] h3 { color: ${p.cyan} !important; }
${s}[data-chatlog-theme] h4 { color: ${p.green} !important; }
${s}[data-chatlog-theme] h5, ${s}[data-chatlog-theme] h6 { color: ${p.text200} !important; }
${s}[data-chatlog-theme] strong, ${s}[data-chatlog-theme] b { color: ${p.yellow} !important; }
${s}[data-chatlog-theme] em, ${s}[data-chatlog-theme] i { color: ${p.purple} !important; font-style: italic; }
${s}[data-chatlog-theme] #main-content a, ${s}[data-chatlog-theme] main a, ${s}[data-chatlog-theme] article a { color: ${p.accent} !important; }
${s}[data-chatlog-theme] #main-content a:hover, ${s}[data-chatlog-theme] main a:hover, ${s}[data-chatlog-theme] article a:hover { color: ${p.accentHover} !important; }

${s} p, ${s} span, ${s} div { color: inherit; }
${s} ul, ${s} ol, ${s} li { color: ${p.text200} !important; }
${s} ul > li::marker { color: ${p.green} !important; }
${s} ol > li::marker { color: ${p.cyan} !important; }

${s} code:not(pre code) {
  color: ${p.green} !important;
  background-color: ${p.bg300} !important;
  border-radius: 4px;
  padding: 1px 5px;
}
${s} pre code { color: ${p.text200} !important; background-color: transparent !important; }
${s} pre code span[style*="color:"] { color: inherit !important; }

${s} blockquote {
  border-left: 3px solid ${p.purple} !important;
  background-color: ${p.bg300} !important;
  color: ${p.text300} !important;
  padding: 8px 12px !important;
  border-radius: 0 4px 4px 0 !important;
}
${s} hr { border-color: ${p.border200} !important; }
${s} mark { background-color: ${p.bg400} !important; color: ${p.text100} !important; }
${s} ::selection { background-color: ${p.accent} !important; color: ${p.bg100} !important; }

${s} table { border-color: ${p.border200} !important; }
${s} th { background-color: ${p.bg300} !important; color: ${p.accent} !important; font-weight: 600; }
${s} td { border-color: ${p.border100} !important; color: ${p.text200} !important; }

/* Generic input theming (claude /chat and chatgpt fall back to this; the
   adapters scope further with transparent overrides where they need to). */
${s} textarea,
${s} [contenteditable],
${s} input[type="text"],
${s} [id*="prompt"],
${s} [class~="composer"],
${s} [class~="chat-input"] {
  background-color: ${p.bg300} !important;
  color: ${p.text100} !important;
  border-color: ${p.border200} !important;
}

${s} footer { background-color: ${p.bg100} !important; color: ${p.text300} !important; }
`;
}

function buildHostCSS(
  themeId: Exclude<ThemeId, 'system'>,
  platform?: string,
): string {
  const p = PALETTES[themeId];
  const s = `html[data-chatlog-theme="${themeId}"]`;
  const scheme = isLightTheme(themeId) ? 'light' : 'dark';
  const adapter = platform ? getAdapter(platform) : null;
  const adapterCSS = adapter?.themeCSS(s, p, scheme) ?? '';
  return `/* === Theme: ${themeId} === */\n${commonThemeCSS(s, p, scheme)}\n${adapterCSS}`;
}

export function getHostCSS(themeId: ThemeId, platform?: string): string {
  if (themeId === 'system') return '';
  return buildHostCSS(themeId, platform);
}
