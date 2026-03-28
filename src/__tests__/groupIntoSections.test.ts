import { describe, expect, it } from 'vitest';
import { groupIntoSections } from '../content/lib/sections';
import type { ContentBlock } from '../types';

describe('groupIntoSections', () => {
  it('returns empty array for empty blocks', () => {
    expect(groupIntoSections([])).toEqual([]);
  });

  it('groups paragraphs with no headings into a single non-heading section', () => {
    const blocks: ContentBlock[] = [
      { type: 'paragraph', segments: [{ text: 'Hello' }] },
      { type: 'paragraph', segments: [{ text: 'World' }] },
    ];
    const sections = groupIntoSections(blocks);
    expect(sections).toHaveLength(1);
    expect(sections[0].isHeading).toBeUndefined();
    expect(sections[0].blocks).toHaveLength(2);
  });

  it('creates a heading section with its body blocks', () => {
    const blocks: ContentBlock[] = [
      { type: 'heading', text: 'Title' },
      { type: 'paragraph', segments: [{ text: 'Body' }] },
      { type: 'code', text: 'x = 1' },
    ];
    const sections = groupIntoSections(blocks);
    expect(sections).toHaveLength(1);
    expect(sections[0].isHeading).toBe(true);
    expect(sections[0].blocks).toHaveLength(3);
    expect(sections[0].blocks[0]).toEqual({ type: 'heading', text: 'Title' });
  });

  it('splits multiple headings into separate sections', () => {
    const blocks: ContentBlock[] = [
      { type: 'heading', text: 'First' },
      { type: 'paragraph', segments: [{ text: 'Body 1' }] },
      { type: 'heading', text: 'Second' },
      { type: 'paragraph', segments: [{ text: 'Body 2' }] },
    ];
    const sections = groupIntoSections(blocks);
    expect(sections).toHaveLength(2);
    expect(sections[0].isHeading).toBe(true);
    expect(sections[0].blocks[0]).toEqual({ type: 'heading', text: 'First' });
    expect(sections[1].isHeading).toBe(true);
    expect(sections[1].blocks[0]).toEqual({ type: 'heading', text: 'Second' });
  });

  it('puts pre-heading blocks in a non-heading section at index 0', () => {
    const blocks: ContentBlock[] = [
      { type: 'paragraph', segments: [{ text: 'Intro' }] },
      { type: 'heading', text: 'Title' },
      { type: 'paragraph', segments: [{ text: 'Body' }] },
    ];
    const sections = groupIntoSections(blocks);
    expect(sections).toHaveLength(2);
    // Pre-heading section at index 0
    expect(sections[0].isHeading).toBeUndefined();
    expect(sections[0].blocks[0]).toEqual({
      type: 'paragraph',
      segments: [{ text: 'Intro' }],
    });
    // Heading section at index 1
    expect(sections[1].isHeading).toBe(true);
  });

  it('handles mixed content: multiple pre-heading blocks then headings', () => {
    const blocks: ContentBlock[] = [
      { type: 'paragraph', segments: [{ text: 'A' }] },
      { type: 'paragraph', segments: [{ text: 'B' }] },
      { type: 'heading', text: 'H1' },
      { type: 'list', items: [[{ text: 'item' }]] },
      { type: 'heading', text: 'H2' },
    ];
    const sections = groupIntoSections(blocks);
    expect(sections).toHaveLength(3);
    // Pre-heading section collects both paragraphs
    expect(sections[0].blocks).toHaveLength(2);
    expect(sections[0].isHeading).toBeUndefined();
    // First heading section with list body
    expect(sections[1].isHeading).toBe(true);
    expect(sections[1].blocks).toHaveLength(2); // heading + list
    // Second heading section with no body
    expect(sections[2].isHeading).toBe(true);
    expect(sections[2].blocks).toHaveLength(1); // just heading
  });
});
