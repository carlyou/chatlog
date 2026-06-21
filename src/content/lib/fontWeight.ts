import { getAdapter } from './adapters/registry';

/**
 * Base font weight applied to the message-content area. 400 means "page
 * default" (normal). The UI is a stepper (- / + 100) bounded by [MIN, MAX];
 * we store the integer CSS weight.
 */
export type FontWeight = number;

export const DEFAULT_FONT_WEIGHT: FontWeight = 400;
export const MIN_FONT_WEIGHT: FontWeight = 100;
export const MAX_FONT_WEIGHT: FontWeight = 900;
export const FONT_WEIGHT_STEP = 100;

export function clampFontWeight(n: number): FontWeight {
  if (!Number.isFinite(n)) return DEFAULT_FONT_WEIGHT;
  return Math.min(MAX_FONT_WEIGHT, Math.max(MIN_FONT_WEIGHT, Math.round(n)));
}

/** Snap a value to the nearest multiple of FONT_WEIGHT_STEP, then clamp. */
export function snapFontWeight(n: number): FontWeight {
  return clampFontWeight(Math.round(n / FONT_WEIGHT_STEP) * FONT_WEIGHT_STEP);
}

/**
 * Build host-page CSS that sets the base `font-weight` of the message-content
 * area to `weight`.
 *
 * We can't lean on inheritance the way font-size leans on `zoom`: host pages
 * pin body text to an explicit weight (e.g. Tailwind `font-normal`), which
 * halts inheritance from the container. So, like the font-*family* override,
 * we target the text elements directly with `!important`.
 *
 * We deliberately DON'T touch `strong`, `b`, `h1`–`h6`, `th`, or `code`: those
 * carry their own weight, so leaving them alone keeps bold text and headings
 * standing out. This shifts the *base* reading weight, not every glyph.
 */
export function buildFontWeightCSS(
  weight: FontWeight,
  platform?: string,
): string {
  if (weight === DEFAULT_FONT_WEIGHT) return '';
  const adapter = platform ? getAdapter(platform) : null;
  const c = adapter?.selectors.messageContainer ?? 'main';
  const s = `html[data-chatlog-font-weight="${weight}"]`;
  return `
/* === Font weight: ${weight} === */
${s} ${c},
${s} ${c} p,
${s} ${c} li,
${s} ${c} td,
${s} ${c} dd,
${s} ${c} dt,
${s} ${c} blockquote,
${s} ${c} label,
${s} ${c} a,
${s} ${c} span {
  font-weight: ${weight} !important;
}
`;
}
