import { describe, expect, it } from 'vitest';
import { computeBaseSignature } from '../content/lib/parsers';

function makeRoot(
  html: string,
  attrs: Record<string, string> = {},
): HTMLDivElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  for (const [key, value] of Object.entries(attrs)) {
    div.setAttribute(key, value);
  }
  return div;
}

describe('computeBaseSignature', () => {
  it('produces a signature with the expected format', () => {
    const root = makeRoot('<p>Hello world</p>');
    const sig = computeBaseSignature('assistant', root);
    const parts = sig.split('|');
    // role | streaming | textDigest | childCount | hasCode | hasHeading | hasList | hasMedia
    expect(parts).toHaveLength(8);
    expect(parts[0]).toBe('assistant');
    expect(parts[1]).toBe('0'); // no streaming attr
    expect(parts[4]).toBe('0'); // no code
    expect(parts[5]).toBe('0'); // no heading
    expect(parts[6]).toBe('0'); // no list
    expect(parts[7]).toBe('0'); // no media
  });

  it('reflects streaming attribute in signature', () => {
    const root = makeRoot('<p>Text</p>');
    const sigNoStream = computeBaseSignature('assistant', root);

    root.setAttribute('data-is-streaming', 'true');
    const sigStream = computeBaseSignature('assistant', root);

    expect(sigNoStream).not.toBe(sigStream);
    expect(sigStream.split('|')[1]).toBe('1');
  });

  it('changes signature when text content changes', () => {
    const root1 = makeRoot('<p>Hello</p>');
    const root2 = makeRoot('<p>Goodbye</p>');
    const sig1 = computeBaseSignature('assistant', root1);
    const sig2 = computeBaseSignature('assistant', root2);
    expect(sig1).not.toBe(sig2);
  });

  it('detects presence of code, heading, list, and media elements', () => {
    const root = makeRoot(
      '<h2>Title</h2><pre><code>code</code></pre><ul><li>item</li></ul><img src="test.png" />',
    );
    const sig = computeBaseSignature('assistant', root);
    const parts = sig.split('|');
    expect(parts[4]).toBe('1'); // hasCode
    expect(parts[5]).toBe('1'); // hasHeading
    expect(parts[6]).toBe('1'); // hasList
    expect(parts[7]).toBe('1'); // hasMedia
  });

  it('includes role in signature', () => {
    const root = makeRoot('<p>Text</p>');
    const userSig = computeBaseSignature('user', root);
    const assistantSig = computeBaseSignature('assistant', root);
    expect(userSig).not.toBe(assistantSig);
    expect(userSig.split('|')[0]).toBe('user');
    expect(assistantSig.split('|')[0]).toBe('assistant');
  });
});
