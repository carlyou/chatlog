import { getAdapter } from './adapters/registry';

/** Discrete font-size scaling percentages. 100 means "page default". */
export const FONT_SIZES = [80, 90, 100, 110, 120, 130, 150] as const;
export type FontSize = (typeof FONT_SIZES)[number];

export const DEFAULT_FONT_SIZE: FontSize = 100;

export function isFontSize(n: number): n is FontSize {
  return (FONT_SIZES as readonly number[]).includes(n);
}

/**
 * Build host-page CSS that scales the message-content area by `size`%.
 *
 * Uses CSS `zoom` because the host pages mix rem-based and px-based sizing
 * (Tailwind utilities like `text-[13px]` compile to fixed values), so a
 * root-level font-size change would only catch half of the typography.
 * `zoom` scales every length inside the container uniformly, which is what
 * a user adjusting "reading size" actually wants.
 *
 * The container is the platform's `messageContainer` selector when an
 * adapter is known, falling back to `main` so non-claude pages still scale.
 */
export function buildFontSizeCSS(size: FontSize, platform?: string): string {
  if (size === DEFAULT_FONT_SIZE) return '';
  const adapter = platform ? getAdapter(platform) : null;
  const container = adapter?.selectors.messageContainer ?? 'main';
  const factor = size / 100;
  const s = `html[data-chatlog-font-size="${size}"]`;
  return `
/* === Font size: ${size}% === */
${s} ${container} {
  zoom: ${factor};
}
`;
}
