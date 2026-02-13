import type { Message, Platform, StructuredContent, ContentBlock, RichText, RichSegment, BranchInfo } from '../../types';
import { getSelectors } from './selectors';
import { perfInc, perfRun, perfSet } from './perf';

// Walk inline child nodes of an element and produce RichText segments
// preserving bold, italic, and inline code formatting.
function extractRichText(el: Element): RichText {
  const segments: RichSegment[] = [];

  function walk(node: Node, bold: boolean, italic: boolean, code: boolean) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text) {
        segments.push({
          text,
          ...(bold && { bold: true }),
          ...(italic && { italic: true }),
          ...(code && { code: true }),
        });
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = (node as Element).tagName.toLowerCase();

    const nextBold = bold || tag === 'strong' || tag === 'b';
    const nextItalic = italic || tag === 'em' || tag === 'i';
    const nextCode = code || tag === 'code';

    for (const child of node.childNodes) {
      walk(child, nextBold, nextItalic, nextCode);
    }
  }

  walk(el, false, false, false);
  return segments;
}

/** Detect broken fence rendering inside a <pre> block.
 *  Returns 'normal' when the block is a real code block, or 'broken' with
 *  the code portion (before the fence) and markdown portion (after it). */
function splitAtFence(text: string): { type: 'normal' } | { type: 'broken'; code: string; markdown: string } {
  const lines = text.split('\n');

  // Check for opening fence at start (```lang or bare ```)
  let start = 0;
  let hasOpeningFence = false;
  if (lines.length > 0 && /^```\w*\s*$/.test(lines[0])) {
    start = 1;
    hasOpeningFence = true;
  }

  // Find first bare closing fence
  for (let i = start; i < lines.length; i++) {
    if (/^```\s*$/.test(lines[i])) {
      const codePart = lines.slice(start, i).join('\n').trim();
      const mdPart = lines.slice(i + 1).join('\n').trim();

      if (mdPart) {
        // Content after fence → code + trailing markdown
        return { type: 'broken', code: codePart, markdown: mdPart };
      }

      if (hasOpeningFence) {
        // Fences at both ends, nothing after → entire content is markdown
        return { type: 'broken', code: '', markdown: lines.slice(start, i).join('\n') };
      }

      // Only a trailing fence, nothing after → strip it, keep as code
      return { type: 'broken', code: codePart, markdown: '' };
    }
  }

  // No closing fence found
  if (hasOpeningFence) {
    // Opening fence but no closing → content is markdown
    return { type: 'broken', code: '', markdown: lines.slice(start).join('\n') };
  }

  return { type: 'normal' };
}

/** Collect className strings from existing sibling elements in the response
 *  container so generated elements match Claude's native rendering. */
function collectClasses(container: Element): Record<string, string> {
  const map: Record<string, string> = {};
  for (const tag of ['h1','h2','h3','h4','h5','h6','p','ol','ul','li','hr','pre']) {
    const el = container.querySelector(tag);
    if (el?.className) map[tag] = el.className;
  }
  return map;
}

/** Walk up from a <pre> to find the outermost code-block wrapper div
 *  (the div.group/copy container that holds copy button + language label + pre). */
function findCodeBlockWrapper(pre: Element): Element | null {
  let el: Element | null = pre.parentElement;
  while (el) {
    if (el.className.includes('group/copy')) return el;
    el = el.parentElement;
  }
  return null;
}

/** Set textContent with inline **bold** parsed into <strong> elements. */
function setInlineText(parent: Element, text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) {
      const strong = document.createElement('strong');
      strong.textContent = boldMatch[1];
      parent.appendChild(strong);
    } else if (part) {
      parent.appendChild(document.createTextNode(part));
    }
  }
}

function parseMarkdownToElements(
  markdown: string,
  classMap: Record<string, string>,
  codeBlockTemplate: Element | null,
): { fragment: DocumentFragment; blocks: ContentBlock[] } {
  const fragment = document.createDocumentFragment();
  const blocks: ContentBlock[] = [];
  const lines = markdown.split('\n');
  let i = 0;

  function applyClass(el: Element, tag: string) {
    if (classMap[tag]) el.className = classMap[tag];
  }

  while (i < lines.length) {
    const line = lines[i];

    // Blank line — skip
    if (!line.trim()) { i++; continue; }

    // Heading: # ... through ###### ...
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const tag = `h${level}`;
      const el = document.createElement(tag);
      applyClass(el, tag);
      setInlineText(el, text);
      fragment.appendChild(el);
      blocks.push({ type: 'heading', text, element: el });
      i++; continue;
    }

    // Horizontal rule: --- or ***
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      const hr = document.createElement('hr');
      applyClass(hr, 'hr');
      fragment.appendChild(hr);
      blocks.push({ type: 'divider' });
      i++; continue;
    }

    // Fenced code block within the markdown: ```...```
    if (/^```/.test(line)) {
      const lang = line.replace(/^```/, '').trim();
      const codeLines: string[] = [];
      i++; // skip opening fence
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      const text = codeLines.join('\n');

      if (codeBlockTemplate) {
        // Clone the full Claude code-block wrapper structure
        const wrapper = codeBlockTemplate.cloneNode(true) as Element;
        const codeEl = wrapper.querySelector('code');
        if (codeEl) {
          codeEl.textContent = text;
          codeEl.className = lang ? `language-${lang}` : '';
        }
        // Update language label
        const langLabel = wrapper.querySelector('.font-small');
        if (langLabel) langLabel.textContent = lang || '';
        fragment.appendChild(wrapper);
      } else {
        const pre = document.createElement('pre');
        applyClass(pre, 'pre');
        const code = document.createElement('code');
        code.textContent = text;
        pre.appendChild(code);
        fragment.appendChild(pre);
      }
      if (text.trim()) blocks.push({ type: 'code', text });
      continue;
    }

    // Ordered list: lines starting with "N. "
    if (/^\d+\.\s/.test(line)) {
      const ol = document.createElement('ol');
      applyClass(ol, 'ol');
      const items: RichText[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const text = lines[i].replace(/^\d+\.\s*/, '');
        const li = document.createElement('li');
        applyClass(li, 'li');
        setInlineText(li, text);
        ol.appendChild(li);
        items.push([{ text }]);
        i++;
      }
      fragment.appendChild(ol);
      if (items.length) blocks.push({ type: 'list', items });
      continue;
    }

    // Unordered list: lines starting with "- " or "* "
    if (/^[-*]\s/.test(line)) {
      const ul = document.createElement('ul');
      applyClass(ul, 'ul');
      const items: RichText[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        const text = lines[i].replace(/^[-*]\s*/, '');
        const li = document.createElement('li');
        applyClass(li, 'li');
        setInlineText(li, text);
        ul.appendChild(li);
        items.push([{ text }]);
        i++;
      }
      fragment.appendChild(ul);
      if (items.length) blocks.push({ type: 'list', items });
      continue;
    }

    // Paragraph: consecutive non-special lines
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^#{1,6}\s/.test(lines[i]) && !/^(-{3,}|\*{3,})\s*$/.test(lines[i]) && !/^```/.test(lines[i]) && !/^\d+\.\s/.test(lines[i]) && !/^[-*]\s/.test(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    const text = paraLines.join('\n').trim();
    if (text) {
      const p = document.createElement('p');
      applyClass(p, 'p');
      setInlineText(p, text);
      fragment.appendChild(p);
      blocks.push({ type: 'paragraph', segments: [{ text }] });
    }
  }

  return { fragment, blocks };
}

export function extractStructuredContent(element: Element): StructuredContent {
  const blocks: ContentBlock[] = [];
  const visited = new WeakSet<Element>();

  element.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, pre, hr, img').forEach((el) => {
    if (visited.has(el)) return;
    visited.add(el);

    const tag = el.tagName.toLowerCase();

    if (/^h[1-6]$/.test(tag)) {
      const text = el.textContent?.trim();
      if (text) blocks.push({ type: 'heading', text, element: el });
    } else if (tag === 'hr') {
      blocks.push({ type: 'divider' });
    } else if (tag === 'p') {
      const text = el.textContent?.trim();
      if (!text) return;
      blocks.push({ type: 'paragraph', segments: extractRichText(el) });
    } else if (tag === 'ul' || tag === 'ol') {
      // Mark all descendant elements as visited to prevent double-parsing
      // (e.g. ChatGPT wraps list-item content in <p> tags)
      el.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, pre, hr, img').forEach((d) => visited.add(d));
      const items: RichText[] = [];
      el.querySelectorAll(':scope > li').forEach((li) => {
        visited.add(li);
        const text = li.textContent?.trim();
        if (text) items.push(extractRichText(li));
      });
      if (items.length > 0) blocks.push({ type: 'list', items });
    } else if (tag === 'pre') {
      const result = splitAtFence(el.textContent || '');
      if (result.type === 'broken') {
        const codeBlockWrapper = findCodeBlockWrapper(el);
        const target = codeBlockWrapper || el;
        const classMap = collectClasses(element);

        if (result.code) {
          // Fix the existing code block — strip leaked markdown from the <code>
          const codeEl = el.querySelector('code') || el;
          codeEl.textContent = result.code;
          blocks.push({ type: 'code', text: result.code });

          // Insert parsed markdown AFTER the wrapper
          if (result.markdown) {
            const { fragment, blocks: parsed } = parseMarkdownToElements(result.markdown, classMap, codeBlockWrapper);
            target.after(fragment);
            blocks.push(...parsed);
          }
        } else {
          // No actual code — replace the entire wrapper with parsed markdown
          if (result.markdown) {
            const { fragment, blocks: parsed } = parseMarkdownToElements(result.markdown, classMap, codeBlockWrapper);
            target.replaceWith(fragment);
            blocks.push(...parsed);
          } else {
            target.remove();
          }
        }
      } else {
        const text = el.textContent?.trim();
        if (text) blocks.push({ type: 'code', text });
      }
    } else if (tag === 'img') {
      const rawSrc = el.getAttribute('src');
      const alt = el.getAttribute('alt') || '';
      if (rawSrc) {
        // Resolve relative URLs (e.g. /api/...) to absolute
        const src = rawSrc.startsWith('/') ? window.location.origin + rawSrc : rawSrc;
        blocks.push({ type: 'image', src, alt });
      }
    }
  });

  // Parse file thumbnails (e.g. uploaded .txt, .pdf files)
  element.querySelectorAll('[data-testid="file-thumbnail"]').forEach((el) => {
    const name = el.querySelector('h3')?.textContent?.trim() || '';
    const info = el.querySelector('p')?.textContent?.trim() || '';
    const extEl = el.querySelector('p.uppercase');
    const ext = extEl?.textContent?.trim() || '';
    if (name) blocks.push({ type: 'file', name, info, ext });
  });

  return { blocks };
}

/** Search a DOM container for branch navigation (e.g. "2 / 3" with prev/next buttons). */
function extractBranchInfo(container: Element): BranchInfo | undefined {
  // Look for a text node matching "N / N" or "N/N"
  const candidates = container.querySelectorAll('span, div');
  for (const el of candidates) {
    const text = el.textContent?.trim() || '';
    const match = text.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (!match) continue;

    const current = parseInt(match[1], 10);
    const total = parseInt(match[2], 10);
    if (total < 2) continue;

    // Find nearby prev/next buttons by walking up to a common parent
    const parent = el.parentElement?.parentElement || el.parentElement;
    if (!parent) continue;

    const buttons = parent.querySelectorAll('button');
    let prevButton: Element | null = null;
    let nextButton: Element | null = null;

    for (const btn of buttons) {
      const label = (btn.getAttribute('aria-label') || '').toLowerCase();
      if (label.includes('previous')) prevButton = btn;
      else if (label.includes('next')) nextButton = btn;
    }

    return { current, total, prevButton, nextButton };
  }
  return undefined;
}

function parseClaudeMessages(container: Element): Message[] {
  const messages: Message[] = [];
  const allGroups = container.querySelectorAll('div.group.relative');

  allGroups.forEach((group) => {
    const text = group.textContent?.trim();
    if (!text) return;

    const isUserMessage = group.className.includes('bg-bg-300');
    const hasStreaming = group.hasAttribute('data-is-streaming');

    if (isUserMessage) {
      // Images live in the grandparent, not inside the text bubble
      const grandparent = group.parentElement?.parentElement;
      const searchScope = grandparent || group;
      const structured = extractStructuredContent(searchScope);
      // Branch nav lives in the render-count wrapper or grandparent
      const branchScope = group.closest('[data-test-render-count]') || grandparent;
      const branchInfo = branchScope ? extractBranchInfo(branchScope) : undefined;
      messages.push({
        id: `msg-${messages.length}`,
        type: 'user',
        text,
        element: group,
        ...(structured.blocks.length > 0 && { structured }),
        ...(branchInfo && { branchInfo }),
      });
    } else if (hasStreaming) {
      const responseContainers = group.querySelectorAll('[class*="row-start-2"]');
      if (responseContainers.length > 0) {
        const textParts: string[] = [];
        const allBlocks: ContentBlock[] = [];
        for (const rc of responseContainers) {
          const t = rc.textContent?.trim();
          if (t) textParts.push(t);
          const { blocks: rcBlocks } = extractStructuredContent(rc);
          allBlocks.push(...rcBlocks);
        }
        const responseText = textParts.join('\n');
        if (responseText) {
          const branchScope = group.closest('[data-test-render-count]') || group;
          const branchInfo = extractBranchInfo(branchScope);
          messages.push({
            id: `msg-${messages.length}`,
            type: 'assistant',
            text: responseText,
            element: responseContainers[0],
            structured: { blocks: allBlocks },
            ...(branchInfo && { branchInfo }),
          });
        }
      }
    }
  });

  return messages;
}

function parseChatGPTMessages(container: Element): Message[] {
  const messages: Message[] = [];
  const allMessages = container.querySelectorAll('[data-message-author-role]');

  allMessages.forEach((msg) => {
    const role = msg.getAttribute('data-message-author-role');
    const text = msg.textContent?.trim();
    if (!text) return;

    if (role === 'user') {
      const structured = extractStructuredContent(msg);
      const article = msg.closest('article');
      const branchInfo = article ? extractBranchInfo(article) : undefined;
      messages.push({
        id: `msg-${messages.length}`,
        type: 'user',
        text,
        element: msg,
        ...(structured.blocks.length > 0 && { structured }),
        ...(branchInfo && { branchInfo }),
      });
    } else if (role === 'assistant') {
      const article = msg.closest('article');
      const branchInfo = article ? extractBranchInfo(article) : undefined;
      messages.push({
        id: `msg-${messages.length}`,
        type: 'assistant',
        text,
        element: msg,
        structured: extractStructuredContent(msg),
        ...(branchInfo && { branchInfo }),
      });
    }
  });

  return messages;
}

export function parseMessages(platform: Platform): Message[] {
  const selectors = getSelectors(platform);
  if (!selectors) return [];

  const container = document.querySelector(selectors.messageContainer);
  if (!container) return [];

  return perfRun('parseMessagesMs', () => {
    perfInc('parseMessagesCalls');
    perfInc('fullParses');

    let messages: Message[] = [];
    if (platform === 'claude') messages = parseClaudeMessages(container);
    else if (platform === 'chatgpt') messages = parseChatGPTMessages(container);

    perfSet('messagesParsedLast', messages.length);
    perfInc('messagesParsedTotal', messages.length);
    return messages;
  });
}
