import { useEffect, useRef } from 'react';
import type { Message, DisplayMode, StructuredContent, ContentBlock, RichText, RichSegment, BranchInfo } from '../../types';
import type { ActiveTarget } from '../hooks/useActiveMessage';
import { SCROLL_REF_RATIO } from '../lib/constants';


import { scrollToTopCenter } from './MessageList';

function scrollElToRefLine(el: HTMLElement) {
  const target = window.innerHeight * SCROLL_REF_RATIO;
  const delta = el.getBoundingClientRect().top - target + 5;

  // Find the nearest scrollable ancestor
  let parent = el.parentElement;
  while (parent) {
    if (parent.scrollHeight > parent.clientHeight) {
      const style = getComputedStyle(parent);
      if (style.overflowY !== 'visible' && style.overflowY !== 'hidden') {
        parent.scrollBy({ top: delta, behavior: 'smooth' });
        return;
      }
    }
    parent = parent.parentElement;
  }
  // Fallback: document scroll
  window.scrollBy({ top: delta, behavior: 'smooth' });
}

interface MessageBubbleProps {
  message: Message;
  displayMode: DisplayMode;
  isActive?: boolean;
  activeSectionIndex?: number | null;
  onLockActive?: (target: ActiveTarget) => void;
}

function Segment({ seg }: { seg: RichSegment }) {
  let el: React.ReactNode = seg.text;
  if (seg.code) el = <code className="chatlog-inline-code">{el}</code>;
  if (seg.bold) el = <strong>{el}</strong>;
  if (seg.italic) el = <em>{el}</em>;
  return <>{el}</>;
}

function RichTextView({ segments }: { segments: RichText }) {
  return (
    <>
      {segments.map((seg, i) => (
        <Segment key={i} seg={seg} />
      ))}
    </>
  );
}

function BranchNav({ branchInfo }: { branchInfo: BranchInfo }) {
  return (
    <div className="chatlog-branch-nav">
      <span className="chatlog-branch-text">Branch</span>
      <button
        className="chatlog-branch-btn"
        onClick={(e) => { e.stopPropagation(); (branchInfo.prevButton as HTMLButtonElement)?.click(); }}
        disabled={branchInfo.current <= 1}
      >&#8249;</button>
      <span className="chatlog-branch-label">
        {branchInfo.current}/{branchInfo.total}
      </span>
      <button
        className="chatlog-branch-btn"
        onClick={(e) => { e.stopPropagation(); (branchInfo.nextButton as HTMLButtonElement)?.click(); }}
        disabled={branchInfo.current >= branchInfo.total}
      >&#8250;</button>
    </div>
  );
}

function BlockView({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'heading':
      return <div className="chatlog-structured-heading">{block.text}</div>;
    case 'paragraph':
      return (
        <p className="chatlog-structured-p">
          <RichTextView segments={block.segments} />
        </p>
      );
    case 'list':
      return (
        <ul className="chatlog-structured-list">
          {block.items.map((item, j) => (
            <li key={j} className="chatlog-structured-li">
              <RichTextView segments={item} />
            </li>
          ))}
        </ul>
      );
    case 'code':
      return <pre className="chatlog-structured-code"><code>{block.text}</code></pre>;
    case 'divider':
      return <hr className="chatlog-structured-hr" />;
    case 'image':
      return <img src={block.src} alt={block.alt} className="chatlog-structured-img" />;
  }
}

interface Section {
  headingElement?: Element;
  blocks: ContentBlock[];
}

function groupIntoSections(blocks: ContentBlock[]): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const block of blocks) {
    if (block.type === 'heading') {
      current = { headingElement: block.element, blocks: [block] };
      sections.push(current);
    } else if (current) {
      current.blocks.push(block);
    } else {
      // Blocks before the first heading — no anchor
      if (!sections.length || sections[0].headingElement) {
        sections.unshift({ blocks: [block] });
        current = null;
      } else {
        sections[0].blocks.push(block);
      }
    }
  }

  return sections;
}

function StructuredView({ structured, anchorMode, activeSectionIndex, onSectionClick }: { structured: StructuredContent; anchorMode?: boolean; activeSectionIndex?: number | null; onSectionClick?: (sectionIndex: number) => void }) {
  const activeSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeSectionIndex != null && activeSectionRef.current) {
      const container = activeSectionRef.current.closest('.chatlog-outline-messages') as HTMLElement | null;
      if (container) {
        scrollToTopCenter(activeSectionRef.current, container);
      }
    }
  }, [activeSectionIndex]);

  if (!anchorMode) {
    return (
      <div className="chatlog-structured">
        {structured.blocks.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
      </div>
    );
  }

  const sections = groupIntoSections(structured.blocks);

  let headingIdx = 0;
  return (
    <div className="chatlog-structured">
      {sections.map((section, i) => {
        if (section.headingElement) {
          const currentIdx = headingIdx++;
          const isSectionActive = activeSectionIndex === currentIdx;
          const handleClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            onSectionClick?.(currentIdx);
            scrollElToRefLine(section.headingElement as HTMLElement);
          };
          return (
            <div
              key={i}
              ref={isSectionActive ? activeSectionRef : undefined}
              className={`chatlog-heading-section${isSectionActive ? ' chatlog-section-active' : ''}`}
              onClick={handleClick}
            >
              {section.blocks.map((block, j) => (
                <BlockView key={j} block={block} />
              ))}
            </div>
          );
        }
        return section.blocks.map((block, j) => (
          <BlockView key={`pre-${j}`} block={block} />
        ));
      })}
    </div>
  );
}

function AssistantCompact({ message }: { message: Message }) {
  const { structured, text } = message;

  if (!structured || structured.blocks.length === 0) {
    return <p className="chatlog-structured-p chatlog-compact-preview">{text}</p>;
  }

  // Take the first two displayable blocks in document order
  const displayable = structured.blocks.filter(
    (b) => b.type === 'heading' || b.type === 'paragraph'
  );

  const first = displayable[0];
  const second = displayable[1];

  return (
    <>
      {first?.type === 'heading' && (
        <div className="chatlog-structured-heading">{first.text}</div>
      )}
      <p className="chatlog-structured-p chatlog-compact-preview">
        {first?.type === 'paragraph' ? (
          <RichTextView segments={first.segments} />
        ) : second?.type === 'paragraph' ? (
          <RichTextView segments={second.segments} />
        ) : (
          text
        )}
      </p>
    </>
  );
}

function AssistantDetailed({ message, activeSectionIndex, onSectionClick }: { message: Message; activeSectionIndex?: number | null; onSectionClick?: (sectionIndex: number) => void }) {
  if (message.structured && message.structured.blocks.length > 0) {
    return <StructuredView structured={message.structured} anchorMode activeSectionIndex={activeSectionIndex} onSectionClick={onSectionClick} />;
  }
  return <>{message.text}</>;
}

export function MessageBubble({ message, displayMode, isActive, activeSectionIndex, onLockActive }: MessageBubbleProps) {
  const handleClick = () => {
    onLockActive?.({ messageId: message.id, sectionIndex: null });
    if (message.element) {
      scrollElToRefLine(message.element as HTMLElement);
    }
  };

  const handleSectionClick = (sectionIndex: number) => {
    onLockActive?.({ messageId: message.id, sectionIndex });
  };

  // In compact mode there are no rendered sections, so always highlight the whole message
  const useSections = displayMode === 'detailed';
  const effectiveSectionIndex = useSections ? activeSectionIndex : null;
  const showMessageHighlight = isActive && effectiveSectionIndex === null;

  if (message.type === 'user') {
    const images = message.structured?.blocks.filter((b) => b.type === 'image') || [];
    const files = message.structured?.blocks.filter((b) => b.type === 'file') || [];
    return (
      <button onClick={handleClick} className={`chatlog-message${showMessageHighlight ? ' chatlog-message-active' : ''}`}>
        {message.branchInfo && <BranchNav branchInfo={message.branchInfo} />}
        {images.length > 0 && (
          <div className="chatlog-message-user-images">
            {images.map((img, i) => (
              img.type === 'image' && <img key={i} src={img.src} alt={img.alt} className="chatlog-structured-img" />
            ))}
          </div>
        )}
        {files.length > 0 && (
          <div className="chatlog-message-user-files">
            {files.map((f, i) => (
              f.type === 'file' && (
                <span key={i} className="chatlog-file-chip">
                  {f.ext && <span className="chatlog-file-ext">{f.ext}</span>}
                  <span className="chatlog-file-name">{f.name}</span>
                </span>
              )
            ))}
          </div>
        )}
        <div className="chatlog-message-user">
          <div className="chatlog-bubble chatlog-bubble-user">{message.text}</div>
        </div>
      </button>
    );
  }

  return (
    <button onClick={handleClick} className={`chatlog-message${showMessageHighlight ? ' chatlog-message-active' : ''}`}>
      {message.branchInfo && <BranchNav branchInfo={message.branchInfo} />}
      <div className="chatlog-message-assistant">
        <div className="chatlog-bubble chatlog-bubble-assistant">
          {displayMode === 'compact' && <AssistantCompact message={message} />}
          {displayMode === 'detailed' && <AssistantDetailed message={message} activeSectionIndex={effectiveSectionIndex} onSectionClick={handleSectionClick} />}
        </div>
      </div>
    </button>
  );
}
