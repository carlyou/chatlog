import type { ShortcutBinding } from '../../types';

/** Returns true only if the binding is enabled and all modifiers + key match exactly. */
export function matchesBinding(e: KeyboardEvent, binding: ShortcutBinding): boolean {
  if (!binding.enabled) return false;
  if (e.key !== binding.key) return false;
  if (e.shiftKey !== !!binding.shift) return false;
  if (e.ctrlKey !== !!binding.ctrl) return false;
  if (e.altKey !== !!binding.alt) return false;
  if (e.metaKey !== !!binding.meta) return false;
  return true;
}

/** Human-readable label for a binding, e.g. "Shift + ArrowLeft" */
export function bindingLabel(binding: ShortcutBinding): string {
  const parts: string[] = [];
  if (binding.ctrl) parts.push('Ctrl');
  if (binding.alt) parts.push('Alt');
  if (binding.shift) parts.push('Shift');
  if (binding.meta) parts.push('Cmd');
  const keyLabel = binding.key === ' ' ? 'Space' : binding.key;
  parts.push(keyLabel);
  return parts.join(' + ');
}
