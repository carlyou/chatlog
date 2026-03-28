import { describe, expect, it } from 'vitest';
import { extractStructuredContent } from '../content/lib/parsers';

function makeContainer(html: string): HTMLDivElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

describe('extractStructuredContent', () => {
  it('extracts a paragraph', () => {
    const el = makeContainer('<p>Hello world</p>');
    const result = extractStructuredContent(el);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].type).toBe('paragraph');
    if (result.blocks[0].type === 'paragraph') {
      expect(result.blocks[0].segments[0].text).toBe('Hello world');
    }
  });

  it('extracts headings', () => {
    const el = makeContainer('<h2>Title</h2><p>Body text</p>');
    const result = extractStructuredContent(el);
    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0].type).toBe('heading');
    if (result.blocks[0].type === 'heading') {
      expect(result.blocks[0].text).toBe('Title');
    }
    expect(result.blocks[1].type).toBe('paragraph');
  });

  it('extracts code blocks', () => {
    const el = makeContainer('<pre><code>const x = 1;</code></pre>');
    const result = extractStructuredContent(el);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].type).toBe('code');
    if (result.blocks[0].type === 'code') {
      expect(result.blocks[0].text).toBe('const x = 1;');
    }
  });

  it('extracts lists and marks children as visited', () => {
    const el = makeContainer(
      '<ul><li><p>Item A</p></li><li><p>Item B</p></li></ul>',
    );
    const result = extractStructuredContent(el);
    // Should produce a single list block, not list + extra paragraphs
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].type).toBe('list');
    if (result.blocks[0].type === 'list') {
      expect(result.blocks[0].items).toHaveLength(2);
    }
  });

  it('promotes bold-only paragraphs to headings when no real headings exist', () => {
    const el = makeContainer(
      '<p><strong>Bold Title</strong></p><p>Regular text</p>',
    );
    const result = extractStructuredContent(el);
    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0].type).toBe('heading');
    if (result.blocks[0].type === 'heading') {
      expect(result.blocks[0].text).toBe('Bold Title');
    }
    expect(result.blocks[1].type).toBe('paragraph');
  });

  it('does not promote bold paragraphs when real headings exist', () => {
    const el = makeContainer(
      '<h2>Real Heading</h2><p><strong>Bold Para</strong></p>',
    );
    const result = extractStructuredContent(el);
    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0].type).toBe('heading');
    expect(result.blocks[1].type).toBe('paragraph');
  });

  it('extracts tables', () => {
    const el = makeContainer(`
      <table>
        <thead><tr><th>Name</th><th>Age</th></tr></thead>
        <tbody><tr><td>Alice</td><td>30</td></tr></tbody>
      </table>
    `);
    const result = extractStructuredContent(el);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].type).toBe('table');
    if (result.blocks[0].type === 'table') {
      expect(result.blocks[0].headers).toEqual(['Name', 'Age']);
      expect(result.blocks[0].rows).toEqual([['Alice', '30']]);
    }
  });

  it('extracts images with relative URL resolution', () => {
    const el = makeContainer('<img src="/api/image.png" alt="screenshot" />');
    const result = extractStructuredContent(el);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].type).toBe('image');
    if (result.blocks[0].type === 'image') {
      expect(result.blocks[0].src).toContain('/api/image.png');
      expect(result.blocks[0].alt).toBe('screenshot');
    }
  });

  it('extracts file thumbnails', () => {
    const el = makeContainer(`
      <div data-testid="file-thumbnail">
        <h3>readme.txt</h3>
        <p>2.1 KB</p>
        <p class="uppercase">TXT</p>
      </div>
    `);
    const result = extractStructuredContent(el);
    const fileBlock = result.blocks.find((b) => b.type === 'file');
    expect(fileBlock).toBeDefined();
    if (fileBlock?.type === 'file') {
      expect(fileBlock.name).toBe('readme.txt');
      expect(fileBlock.ext).toBe('TXT');
    }
  });

  it('extracts rich text with bold and italic', () => {
    const el = makeContainer(
      '<p>Hello <strong>bold</strong> and <em>italic</em></p>',
    );
    const result = extractStructuredContent(el);
    expect(result.blocks).toHaveLength(1);
    if (result.blocks[0].type === 'paragraph') {
      const segments = result.blocks[0].segments;
      expect(segments.some((s) => s.bold && s.text === 'bold')).toBe(true);
      expect(segments.some((s) => s.italic && s.text === 'italic')).toBe(true);
    }
  });

  it('extracts horizontal rules', () => {
    const el = makeContainer('<p>Before</p><hr /><p>After</p>');
    const result = extractStructuredContent(el);
    expect(result.blocks).toHaveLength(3);
    expect(result.blocks[1].type).toBe('divider');
  });

  it('cleans up _el from paragraph blocks', () => {
    const el = makeContainer('<p>Test</p>');
    const result = extractStructuredContent(el);
    expect(result.blocks).toHaveLength(1);
    if (result.blocks[0].type === 'paragraph') {
      expect(result.blocks[0]._el).toBeUndefined();
    }
  });
});
