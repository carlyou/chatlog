export type FontId =
  | 'system'
  // Sans-serif
  | 'inter'
  | 'helvetica-neue'
  | 'verdana'
  | 'roboto'
  // Serif
  | 'georgia'
  | 'charter'
  // Monospace (programming-friendly)
  | 'sf-mono'
  | 'monaco'
  | 'menlo'
  | 'jetbrains-mono'
  | 'fira-code'
  | 'cascadia-code'
  | 'ibm-plex-mono'
  | 'source-code-pro'
  | 'consolas'
  | 'courier-new'
  | 'andale-mono';

export interface FontMeta {
  id: FontId;
  name: string;
  /** Optional group label for the <optgroup>. Adapters render fonts grouped. */
  group?: 'Sans-serif' | 'Serif' | 'Monospace';
}

export const FONTS: FontMeta[] = [
  { id: 'system', name: 'System default' },
  // Sans-serif
  { id: 'inter', name: 'Inter', group: 'Sans-serif' },
  { id: 'helvetica-neue', name: 'Helvetica Neue', group: 'Sans-serif' },
  { id: 'verdana', name: 'Verdana', group: 'Sans-serif' },
  { id: 'roboto', name: 'Roboto', group: 'Sans-serif' },
  // Serif
  { id: 'georgia', name: 'Georgia', group: 'Serif' },
  { id: 'charter', name: 'Charter', group: 'Serif' },
  // Monospace
  { id: 'sf-mono', name: 'SF Mono', group: 'Monospace' },
  { id: 'monaco', name: 'Monaco', group: 'Monospace' },
  { id: 'menlo', name: 'Menlo', group: 'Monospace' },
  { id: 'jetbrains-mono', name: 'JetBrains Mono', group: 'Monospace' },
  { id: 'fira-code', name: 'Fira Code', group: 'Monospace' },
  { id: 'cascadia-code', name: 'Cascadia Code', group: 'Monospace' },
  { id: 'ibm-plex-mono', name: 'IBM Plex Mono', group: 'Monospace' },
  { id: 'source-code-pro', name: 'Source Code Pro', group: 'Monospace' },
  { id: 'consolas', name: 'Consolas', group: 'Monospace' },
  { id: 'courier-new', name: 'Courier New', group: 'Monospace' },
  { id: 'andale-mono', name: 'Andale Mono', group: 'Monospace' },
];

const MONO_FONTS: ReadonlySet<string> = new Set(
  FONTS.filter((f) => f.group === 'Monospace').map((f) => f.id),
);

export function isMonoFont(id: FontId): boolean {
  return MONO_FONTS.has(id);
}

/** Map font ID to CSS font-family stack. Stacks include sensible fallbacks
 *  so the choice degrades gracefully on systems where the named face isn't
 *  installed. */
export function fontFamily(id: FontId): string | null {
  switch (id) {
    case 'system':
      return null;
    // Sans-serif
    case 'inter':
      return 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    case 'helvetica-neue':
      return '"Helvetica Neue", Helvetica, Arial, sans-serif';
    case 'verdana':
      return 'Verdana, Geneva, sans-serif';
    case 'roboto':
      return 'Roboto, system-ui, -apple-system, "Segoe UI", sans-serif';
    // Serif
    case 'georgia':
      return 'Georgia, "Times New Roman", serif';
    case 'charter':
      return 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif';
    // Monospace
    case 'sf-mono':
      return '"SF Mono", SFMono-Regular, ui-monospace, monospace';
    case 'monaco':
      return 'Monaco, ui-monospace, monospace';
    case 'menlo':
      return 'Menlo, ui-monospace, monospace';
    case 'jetbrains-mono':
      return '"JetBrains Mono", ui-monospace, monospace';
    case 'fira-code':
      return '"Fira Code", ui-monospace, monospace';
    case 'cascadia-code':
      return '"Cascadia Code", "Cascadia Mono", ui-monospace, monospace';
    case 'ibm-plex-mono':
      return '"IBM Plex Mono", ui-monospace, monospace';
    case 'source-code-pro':
      return '"Source Code Pro", ui-monospace, monospace';
    case 'consolas':
      return 'Consolas, "Lucida Console", ui-monospace, monospace';
    case 'courier-new':
      return '"Courier New", Courier, monospace';
    case 'andale-mono':
      return '"Andale Mono", ui-monospace, monospace';
  }
}

/**
 * Build host-page CSS for a font override.
 * Targets all text in the main content area.
 */
export function buildFontCSS(fontId: FontId): string {
  const family = fontFamily(fontId);
  if (!family) return '';

  const s = `html[data-chatlog-font="${fontId}"]`;
  return `
/* === Font: ${fontId} === */
${s} body,
${s} p,
${s} span,
${s} div,
${s} li,
${s} td,
${s} th,
${s} h1,
${s} h2,
${s} h3,
${s} h4,
${s} h5,
${s} h6,
${s} blockquote,
${s} label,
${s} input,
${s} textarea,
${s} button,
${s} a {
  font-family: ${family} !important;
}
${
  isMonoFont(fontId)
    ? `/* Monospace font — apply to code blocks too */
${s} pre,
${s} pre code,
${s} code {
  font-family: ${family} !important;
}`
    : ''
}
`;
}
