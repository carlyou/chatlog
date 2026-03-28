import { describe, expect, it } from 'vitest';
import { splitAtFence } from '../content/lib/parsers';

describe('splitAtFence', () => {
  it('returns normal for plain code with no fences', () => {
    const result = splitAtFence('const x = 1;\nconsole.log(x);');
    expect(result).toEqual({ type: 'normal' });
  });

  it('returns normal for empty string', () => {
    const result = splitAtFence('');
    expect(result).toEqual({ type: 'normal' });
  });

  it('detects broken block with opening+closing fence and trailing markdown', () => {
    const input = '```js\nconst x = 1;\n```\n## Next Section\nSome text';
    const result = splitAtFence(input);
    expect(result).toEqual({
      type: 'broken',
      code: 'const x = 1;',
      markdown: '## Next Section\nSome text',
    });
  });

  it('detects opening+closing fence with no trailing content as all-markdown', () => {
    const input = '```js\nconst x = 1;\n```';
    const result = splitAtFence(input);
    expect(result).toEqual({
      type: 'broken',
      code: '',
      markdown: 'const x = 1;',
    });
  });

  it('strips trailing fence when no opening fence', () => {
    const input = 'const x = 1;\nconsole.log(x);\n```';
    const result = splitAtFence(input);
    expect(result).toEqual({
      type: 'broken',
      code: 'const x = 1;\nconsole.log(x);',
      markdown: '',
    });
  });

  it('treats content as markdown when opening fence but no closing fence', () => {
    const input = '```js\nconst x = 1;\nconsole.log(x);';
    const result = splitAtFence(input);
    expect(result).toEqual({
      type: 'broken',
      code: '',
      markdown: 'const x = 1;\nconsole.log(x);',
    });
  });

  it('handles opening fence with language tag', () => {
    const input = '```python\nprint("hello")\n```\n# Heading';
    const result = splitAtFence(input);
    expect(result).toEqual({
      type: 'broken',
      code: 'print("hello")',
      markdown: '# Heading',
    });
  });
});
