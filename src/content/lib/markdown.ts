import type { ContentBlock, Message, RichText } from '../../types';

function richTextToMarkdown(segments: RichText): string {
  return segments
    .map((seg) => {
      let text = seg.text;
      if (seg.code) text = `\`${text}\``;
      if (seg.bold) text = `**${text}**`;
      if (seg.italic) text = `*${text}*`;
      return text;
    })
    .join('');
}

function blockToMarkdown(block: ContentBlock): string {
  switch (block.type) {
    case 'heading':
      return `### ${block.text}`;
    case 'paragraph':
      return richTextToMarkdown(block.segments);
    case 'list':
      return block.items
        .map((item) => `- ${richTextToMarkdown(item)}`)
        .join('\n');
    case 'code':
      return `\`\`\`\n${block.text}\n\`\`\``;
    case 'divider':
      return '---';
    case 'image':
      return `![${block.alt}](${block.src})`;
    case 'table': {
      const lines: string[] = [];
      if (block.headers.length > 0) {
        lines.push(`| ${block.headers.join(' | ')} |`);
        lines.push(`| ${block.headers.map(() => '---').join(' | ')} |`);
      }
      for (const row of block.rows) {
        lines.push(`| ${row.join(' | ')} |`);
      }
      return lines.join('\n');
    }
    case 'file':
      return `[${block.name}] (${block.info})`;
  }
}

export function messagesToMarkdown(messages: Message[]): string {
  const title = document.title || 'Conversation';
  const lines: string[] = [`# ${title}`, ''];

  for (const msg of messages) {
    const role = msg.type === 'user' ? 'User' : 'Assistant';
    lines.push(`## ${role}`, '');

    if (msg.structured && msg.structured.blocks.length > 0) {
      for (const block of msg.structured.blocks) {
        lines.push(blockToMarkdown(block), '');
      }
    } else {
      lines.push(msg.text, '');
    }
  }

  return lines.join('\n');
}

export function downloadMarkdown(messages: Message[]) {
  const content = messagesToMarkdown(messages);
  const title = document.title || 'conversation';
  const filename = `${
    title
      .replace(/[^a-zA-Z0-9_\- ]/g, '')
      .trim()
      .replace(/\s+/g, '-') || 'conversation'
  }.md`;

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
