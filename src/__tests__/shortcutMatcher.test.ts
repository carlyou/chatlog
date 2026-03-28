import { describe, expect, it } from 'vitest';
import { bindingLabel, matchesBinding } from '../content/lib/shortcutMatcher';

function makeEvent(overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return {
    key: '',
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    ...overrides,
  } as KeyboardEvent;
}

describe('matchesBinding', () => {
  it('returns false when binding is disabled', () => {
    const binding = { enabled: false, key: 'a' };
    const event = makeEvent({ key: 'a' });
    expect(matchesBinding(event, binding)).toBe(false);
  });

  it('matches exact key with no modifiers', () => {
    const binding = { enabled: true, key: 'a' };
    const event = makeEvent({ key: 'a' });
    expect(matchesBinding(event, binding)).toBe(true);
  });

  it('requires shift when binding has shift: true', () => {
    const binding = { enabled: true, key: 'A', shift: true };
    expect(
      matchesBinding(makeEvent({ key: 'A', shiftKey: true }), binding),
    ).toBe(true);
    expect(
      matchesBinding(makeEvent({ key: 'A', shiftKey: false }), binding),
    ).toBe(false);
  });

  it('returns false when event has extra modifier not in binding', () => {
    const binding = { enabled: true, key: 'a' };
    const event = makeEvent({ key: 'a', ctrlKey: true });
    expect(matchesBinding(event, binding)).toBe(false);
  });

  it('matches complex binding with multiple modifiers', () => {
    const binding = { enabled: true, key: 'k', ctrl: true, shift: true };
    expect(
      matchesBinding(
        makeEvent({ key: 'k', ctrlKey: true, shiftKey: true }),
        binding,
      ),
    ).toBe(true);
    // Missing one modifier
    expect(
      matchesBinding(
        makeEvent({ key: 'k', ctrlKey: true, shiftKey: false }),
        binding,
      ),
    ).toBe(false);
  });
});

describe('bindingLabel', () => {
  it('returns just the key for a simple binding', () => {
    expect(bindingLabel({ enabled: true, key: 'a' })).toBe('a');
  });

  it('shows Space for space key', () => {
    expect(bindingLabel({ enabled: true, key: ' ' })).toBe('Space');
  });

  it('includes modifiers in order', () => {
    expect(
      bindingLabel({ enabled: true, key: 'a', ctrl: true, shift: true }),
    ).toBe('Ctrl + Shift + a');
  });

  it('shows Cmd for meta modifier', () => {
    expect(bindingLabel({ enabled: true, key: 'k', meta: true })).toBe(
      'Cmd + k',
    );
  });
});
