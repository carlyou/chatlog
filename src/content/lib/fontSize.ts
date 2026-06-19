import { getAdapter } from './adapters/registry';

/**
 * Font-size scaling as a percentage. 100 means "page default". The UI is a
 * stepper (- / + 5%) bounded by [MIN, MAX]; we store the integer.
 */
export type FontSize = number;

export const DEFAULT_FONT_SIZE: FontSize = 100;
export const MIN_FONT_SIZE: FontSize = 50;
export const MAX_FONT_SIZE: FontSize = 300;
export const FONT_SIZE_STEP = 5;

export function clampFontSize(n: number): FontSize {
  if (!Number.isFinite(n)) return DEFAULT_FONT_SIZE;
  return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, Math.round(n)));
}

/** Snap a value to the nearest multiple of FONT_SIZE_STEP, then clamp. */
export function snapFontSize(n: number): FontSize {
  return clampFontSize(Math.round(n / FONT_SIZE_STEP) * FONT_SIZE_STEP);
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
