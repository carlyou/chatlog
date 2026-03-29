export type FontId =
  | 'system'
  | 'monaco'
  | 'menlo'
  | 'courier-new'
  | 'andale-mono'
  | 'sf-mono'
  | 'georgia'
  | 'helvetica-neue'
  | 'verdana';

export interface FontMeta {
  id: FontId;
  name: string;
}

export const FONTS: FontMeta[] = [
  { id: 'system', name: 'System default' },
  { id: 'monaco', name: 'Monaco' },
  { id: 'menlo', name: 'Menlo' },
  { id: 'sf-mono', name: 'SF Mono' },
  { id: 'courier-new', name: 'Courier New' },
  { id: 'andale-mono', name: 'Andale Mono' },
  { id: 'georgia', name: 'Georgia' },
  { id: 'helvetica-neue', name: 'Helvetica Neue' },
  { id: 'verdana', name: 'Verdana' },
];

const MONO_FONTS: ReadonlySet<string> = new Set([
  'monaco',
  'menlo',
  'sf-mono',
  'courier-new',
  'andale-mono',
]);

export function isMonoFont(id: FontId): boolean {
  return MONO_FONTS.has(id);
}

/** Map font ID to CSS font-family stack */
export function fontFamily(id: FontId): string | null {
  switch (id) {
    case 'system':
      return null;
    case 'monaco':
      return 'Monaco, monospace';
    case 'menlo':
      return 'Menlo, monospace';
    case 'sf-mono':
      return '"SF Mono", SFMono-Regular, monospace';
    case 'courier-new':
      return '"Courier New", Courier, monospace';
    case 'andale-mono':
      return '"Andale Mono", monospace';
    case 'georgia':
      return 'Georgia, "Times New Roman", serif';
    case 'helvetica-neue':
      return '"Helvetica Neue", Helvetica, Arial, sans-serif';
    case 'verdana':
      return 'Verdana, Geneva, sans-serif';
  }
}

/**
 * Build host-page CSS for a font override.
 * Targets all text in the main content area.
 */
export function buildFontCSS(fontId: FontId): string {
  const family = fontFamily(fontId);
  if (!family) return '';

  return `
/* === Font: ${fontId} === */
html[data-chatlog-font="${fontId}"] body,
html[data-chatlog-font="${fontId}"] p,
html[data-chatlog-font="${fontId}"] span,
html[data-chatlog-font="${fontId}"] div,
html[data-chatlog-font="${fontId}"] li,
html[data-chatlog-font="${fontId}"] td,
html[data-chatlog-font="${fontId}"] th,
html[data-chatlog-font="${fontId}"] h1,
html[data-chatlog-font="${fontId}"] h2,
html[data-chatlog-font="${fontId}"] h3,
html[data-chatlog-font="${fontId}"] h4,
html[data-chatlog-font="${fontId}"] h5,
html[data-chatlog-font="${fontId}"] h6,
html[data-chatlog-font="${fontId}"] blockquote,
html[data-chatlog-font="${fontId}"] label,
html[data-chatlog-font="${fontId}"] input,
html[data-chatlog-font="${fontId}"] textarea,
html[data-chatlog-font="${fontId}"] button,
html[data-chatlog-font="${fontId}"] a {
  font-family: ${family} !important;
}
${
    isMonoFont(fontId)
      ? `/* Monospace font — apply to code blocks too */
html[data-chatlog-font="${fontId}"] pre,
html[data-chatlog-font="${fontId}"] pre code,
html[data-chatlog-font="${fontId}"] code {
  font-family: ${family} !important;
}`
      : ''
  }
`;
}
