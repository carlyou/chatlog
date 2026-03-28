import type { ContentBlock } from '../../types';

export interface Section {
  isHeading?: boolean;
  headingElement?: Element;
  blocks: ContentBlock[];
}

export function groupIntoSections(blocks: ContentBlock[]): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const block of blocks) {
    if (block.type === 'heading') {
      current = {
        isHeading: true,
        headingElement: block.element,
        blocks: [block],
      };
      sections.push(current);
    } else if (current) {
      current.blocks.push(block);
    } else {
      // Blocks before the first heading — no anchor
      if (!sections.length || sections[0].isHeading) {
        sections.unshift({ blocks: [block] });
        current = null;
      } else {
        sections[0].blocks.push(block);
      }
    }
  }

  return sections;
}
