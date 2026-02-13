import type { Message, Platform, StructuredContent, ContentBlock, RichText, RichSegment, BranchInfo } from '../../types';
import { getSelectors } from './selectors';
import { perfInc, perfRun, perfSet } from './perf';

let rootIdCounter = 0;
const rootIdMap = new WeakMap<Element, string>();

function getStableRootId(root: Element): string {
  let id = rootIdMap.get(root);
  if (!id) {
    rootIdCounter += 1;
    id = `msg-${rootIdCounter}`;
    rootIdMap.set(root, id);
  }
  return id;
}

function hashText(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

const TEXT_DIGEST_SAMPLE_SIZE = 96;

function digestTextSample(text: string): string {
  const len = text.length;
  if (len === 0) return '0:0:0';
  const head = text.slice(0, TEXT_DIGEST_SAMPLE_SIZE);
  const tail = len > TEXT_DIGEST_SAMPLE_SIZE ? text.slice(-TEXT_DIGEST_SAMPLE_SIZE) : '';
  return `${len}:${hashText(head)}:${hashText(tail)}`;
}

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

export function getMessageRootSelector(platform: Platform): string | null {
  if (platform === 'claude') return 'div.group.relative';
  if (platform === 'chatgpt') return '[data-message-author-role]';
  return null;
}

export function getMessageRoots(platform: Platform, container: Element): Element[] {
  const selector = getMessageRootSelector(platform);
  if (!selector) return [];
  return Array.from(container.querySelectorAll(selector));
}

export function getMessageRootForNode(platform: Platform, node: Node): Element | null {
  const selector = getMessageRootSelector(platform);
  if (!selector) return null;
  const el = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
  if (!el) return null;
  return el.closest(selector);
}

export function computeMessageRootSignature(platform: Platform, root: Element): string {
  const role = platform === 'chatgpt'
    ? root.getAttribute('data-message-author-role') || 'unknown'
    : (root.className.includes('bg-bg-300') ? 'user' : 'assistant');
  const hasStreaming = root.hasAttribute('data-is-streaming') ? '1' : '0';
  const textDigest = digestTextSample(root.textContent || '');
  const childCount = root.childElementCount;
  const hasCode = root.querySelector('pre') ? '1' : '0';
  const hasHeading = root.querySelector('h1,h2,h3,h4,h5,h6') ? '1' : '0';
  const hasList = root.querySelector('ul,ol') ? '1' : '0';
  const hasMedia = root.querySelector('img,[data-testid="file-thumbnail"]') ? '1' : '0';
  return [role, hasStreaming, textDigest, childCount, hasCode, hasHeading, hasList, hasMedia].join('|');
}

function parseClaudeMessageRoot(root: Element): Message | null {
  const text = root.textContent?.trim();
  if (!text) return null;

  const id = getStableRootId(root);
  const isUserMessage = root.className.includes('bg-bg-300');
  const hasStreaming = root.hasAttribute('data-is-streaming');

  if (isUserMessage) {
    const grandparent = root.parentElement?.parentElement;
    const searchScope = grandparent || root;
    const structured = extractStructuredContent(searchScope);
    const branchScope = root.closest('[data-test-render-count]') || grandparent;
    const branchInfo = branchScope ? extractBranchInfo(branchScope) : undefined;
    return {
      id,
      type: 'user',
      text,
      element: root,
      ...(structured.blocks.length > 0 && { structured }),
      ...(branchInfo && { branchInfo }),
    };
  }

  if (!hasStreaming) return null;

  const responseContainers = root.querySelectorAll('[class*="row-start-2"]');
  if (responseContainers.length === 0) return null;

  const textParts: string[] = [];
  const allBlocks: ContentBlock[] = [];
  for (const rc of responseContainers) {
    const t = rc.textContent?.trim();
    if (t) textParts.push(t);
    const { blocks } = extractStructuredContent(rc);
    allBlocks.push(...blocks);
  }

  const responseText = textParts.join('\n');
  if (!responseText) return null;

  const branchScope = root.closest('[data-test-render-count]') || root;
  const branchInfo = extractBranchInfo(branchScope);
  return {
    id,
    type: 'assistant',
    text: responseText,
    element: responseContainers[0],
    structured: { blocks: allBlocks },
    ...(branchInfo && { branchInfo }),
  };
}

function parseChatGPTMessageRoot(root: Element): Message | null {
  const role = root.getAttribute('data-message-author-role');
  const text = root.textContent?.trim();
  if (!text || (role !== 'user' && role !== 'assistant')) return null;

  const id = getStableRootId(root);
  const article = root.closest('article');
  const branchInfo = article ? extractBranchInfo(article) : undefined;

  if (role === 'user') {
    const structured = extractStructuredContent(root);
    return {
      id,
      type: 'user',
      text,
      element: root,
      ...(structured.blocks.length > 0 && { structured }),
      ...(branchInfo && { branchInfo }),
    };
  }

  return {
    id,
    type: 'assistant',
    text,
    element: root,
    structured: extractStructuredContent(root),
    ...(branchInfo && { branchInfo }),
  };
}

export function parseMessageRoot(platform: Platform, root: Element): Message | null {
  return perfRun('parseMessagesMs', () => {
    if (platform === 'claude') return parseClaudeMessageRoot(root);
    if (platform === 'chatgpt') return parseChatGPTMessageRoot(root);
    return null;
  });
}

export function parseMessages(platform: Platform): Message[] {
  const selectors = getSelectors(platform);
  if (!selectors) return [];

  const container = document.querySelector(selectors.messageContainer);
  if (!container) return [];

  return perfRun('parseMessagesMs', () => {
    perfInc('parseMessagesCalls');
    const roots = getMessageRoots(platform, container);
    const messages: Message[] = [];
    for (const root of roots) {
      const parsed = parseMessageRoot(platform, root);
      if (parsed) messages.push(parsed);
    }
    perfSet('messagesParsedLast', messages.length);
    perfInc('messagesParsedTotal', messages.length);
    return messages;
  });
}
