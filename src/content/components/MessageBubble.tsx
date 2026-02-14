import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Message, DisplayMode, StructuredContent, ContentBlock, RichText, RichSegment, BranchInfo } from '../../types';
import type { ActiveTarget } from '../hooks/useActiveMessage';
import { SCROLL_REF_RATIO } from '../lib/constants';
import { BookmarkButton } from './BookmarkButton';


import { scrollToTopCenter } from './MessageList';

const SearchQueryContext = createContext<string | undefined>(undefined);

function HighlightText({ text }: { text: string }) {
  const query = useContext(SearchQueryContext);
  if (!query || !query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="chatlog-search-mark">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function scrollElToRefLine(el: HTMLElement) {
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
  onJumpNavigate?: () => void;
  searchQuery?: string;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
}

function Segment({ seg }: { seg: RichSegment }) {
  let el: React.ReactNode = <HighlightText text={seg.text} />;
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

function CollapseChevron({ collapsed, onClick }: { collapsed: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <svg
      className="chatlog-chevron"
      onClick={onClick}
      viewBox="0 0 16 16"
      width="12"
      height="12"
    >
      {collapsed ? (
        <path d="M3 10L8 5L13 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ) : (
        <path d="M3 6L8 11L13 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      )}
    </svg>
  );
}

function BlockView({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'heading':
      return <div className="chatlog-structured-heading"><HighlightText text={block.text} /></div>;
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
      return <pre className="chatlog-structured-code"><code><HighlightText text={block.text} /></code></pre>;
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

function StructuredView({ structured, anchorMode, activeSectionIndex, onSectionClick, allCollapsed, startCollapsed }: { structured: StructuredContent; anchorMode?: boolean; activeSectionIndex?: number | null; onSectionClick?: (sectionIndex: number) => void; allCollapsed?: boolean; startCollapsed?: boolean }) {
  const activeSectionRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState<Set<number>>(() => {
    if (!startCollapsed) return new Set();
    const sections = groupIntoSections(structured.blocks);
    const count = sections.filter(s => s.headingElement).length;
    return new Set(Array.from({ length: count }, (_, i) => i));
  });
  const prevAllCollapsedRef = useRef(allCollapsed);

  useEffect(() => {
    if (!prevAllCollapsedRef.current && allCollapsed) {
      const sections = groupIntoSections(structured.blocks);
      const count = sections.filter(s => s.headingElement).length;
      setCollapsed(new Set(Array.from({ length: count }, (_, i) => i)));
    } else if (prevAllCollapsedRef.current && !allCollapsed) {
      setCollapsed(new Set());
    }
    prevAllCollapsedRef.current = allCollapsed;
  }, [allCollapsed, structured.blocks]);

  const toggleCollapse = (idx: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

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
          const isCollapsed = collapsed.has(currentIdx);
          const handleClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (e.shiftKey) {
              toggleCollapse(currentIdx);
              return;
            }
            onSectionClick?.(currentIdx);
            scrollElToRefLine(section.headingElement as HTMLElement);
          };
          const handleChevronClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            toggleCollapse(currentIdx);
          };
          const headingBlock = section.blocks[0];
          const bodyBlocks = section.blocks.slice(1);
          return (
            <div
              key={i}
              ref={isSectionActive ? activeSectionRef : undefined}
              className={`chatlog-heading-section${isSectionActive ? ' chatlog-section-active' : ''}`}
              onClick={handleClick}
            >
              <div className="chatlog-structured-heading chatlog-heading-collapsible">
                <span className="chatlog-heading-text">{headingBlock.type === 'heading' ? <HighlightText text={headingBlock.text} /> : ''}</span>
                <CollapseChevron collapsed={isCollapsed} onClick={handleChevronClick} />
              </div>
              {bodyBlocks.length > 0 && (
                <div className={`chatlog-collapse-body${isCollapsed ? ' collapsed' : ''}`}>
                  <div className="chatlog-collapse-inner">
                    {bodyBlocks.map((block, j) => (
                      <BlockView key={j} block={block} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }
        // Pre-heading blocks: clamp to 2 lines when allCollapsed
        return (
          <div key={`pre-${i}`} className={allCollapsed ? 'chatlog-compact-preview' : undefined}>
            {section.blocks.map((block, j) => (
              <BlockView key={j} block={block} />
            ))}
          </div>
        );
      })}
    </div>
  );
}


function AssistantCompact({ message }: { message: Message }) {
  const { structured, text } = message;

  if (!structured || structured.blocks.length === 0) {
    return <p className="chatlog-structured-p chatlog-compact-preview"><HighlightText text={text} /></p>;
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
        <div className="chatlog-structured-heading"><HighlightText text={first.text} /></div>
      )}
      <p className="chatlog-structured-p chatlog-compact-preview">
        {first?.type === 'paragraph' ? (
          <RichTextView segments={first.segments} />
        ) : second?.type === 'paragraph' ? (
          <RichTextView segments={second.segments} />
        ) : (
          <HighlightText text={text} />
        )}
      </p>
    </>
  );
}

function AssistantDetailed({ message, activeSectionIndex, onSectionClick, allCollapsed, startCollapsed }: { message: Message; activeSectionIndex?: number | null; onSectionClick?: (sectionIndex: number) => void; allCollapsed?: boolean; startCollapsed?: boolean }) {
  if (message.structured && message.structured.blocks.length > 0) {
    return <StructuredView structured={message.structured} anchorMode activeSectionIndex={activeSectionIndex} onSectionClick={onSectionClick} allCollapsed={allCollapsed} startCollapsed={startCollapsed} />;
  }
  return <HighlightText text={message.text} />;
}

export function MessageBubble({ message, displayMode, isActive, activeSectionIndex, onLockActive, onJumpNavigate, searchQuery, bookmarked, onToggleBookmark }: MessageBubbleProps) {
  const [messageCollapsed, setMessageCollapsed] = useState(displayMode === 'outline');

  // Sync collapsed state when switching display modes
  useEffect(() => {
    setMessageCollapsed(displayMode === 'outline');
  }, [displayMode]);

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey && displayMode !== 'compact' && message.type === 'assistant') {
      e.stopPropagation();
      setMessageCollapsed((prev) => !prev);
      return;
    }
    onJumpNavigate?.();
    onLockActive?.({ messageId: message.id, sectionIndex: null });
    if (message.element) {
      scrollElToRefLine(message.element as HTMLElement);
    }
  };

  const handleSectionClick = (sectionIndex: number) => {
    onJumpNavigate?.();
    onLockActive?.({ messageId: message.id, sectionIndex });
  };

  const handleMessageCollapseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMessageCollapsed((prev) => !prev);
  };

  // In compact mode there are no rendered sections, so always highlight the whole message
  const useSections = displayMode === 'detailed' || displayMode === 'outline';
  const effectiveSectionIndex = useSections ? activeSectionIndex : null;
  const showMessageHighlight = isActive && effectiveSectionIndex === null;

  const content = (() => {
  if (message.type === 'user') {
    const showMedia = displayMode !== 'compact';
    const images = showMedia ? (message.structured?.blocks.filter((b) => b.type === 'image') || []) : [];
    const files = showMedia ? (message.structured?.blocks.filter((b) => b.type === 'file') || []) : [];
    return (
      <button onClick={handleClick} className={`chatlog-message${showMessageHighlight ? ' chatlog-message-active' : ''}`}>
        {onToggleBookmark && <BookmarkButton bookmarked={!!bookmarked} onToggle={onToggleBookmark} />}
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
          <div className="chatlog-bubble chatlog-bubble-user"><HighlightText text={message.text} /></div>
        </div>
      </button>
    );
  }

  const hasContent = displayMode !== 'compact' && message.structured && message.structured.blocks.length > 0;

  return (
    <button onClick={handleClick} className={`chatlog-message${showMessageHighlight ? ' chatlog-message-active' : ''}`}>
      {onToggleBookmark && <BookmarkButton bookmarked={!!bookmarked} onToggle={onToggleBookmark} />}
      {message.branchInfo && <BranchNav branchInfo={message.branchInfo} />}
      <div className="chatlog-message-assistant">
        <div className="chatlog-bubble chatlog-bubble-assistant">
          {displayMode === 'compact' && <AssistantCompact message={message} />}
          {displayMode === 'outline' && (
            <>
              {hasContent && <CollapseChevron collapsed={messageCollapsed} onClick={handleMessageCollapseClick} />}
              <AssistantDetailed message={message} activeSectionIndex={effectiveSectionIndex} onSectionClick={handleSectionClick} allCollapsed={messageCollapsed} startCollapsed />
            </>
          )}
          {displayMode === 'detailed' && (
            <>
              {hasContent && <CollapseChevron collapsed={messageCollapsed} onClick={handleMessageCollapseClick} />}
              <AssistantDetailed message={message} activeSectionIndex={effectiveSectionIndex} onSectionClick={handleSectionClick} allCollapsed={messageCollapsed} />
            </>
          )}
        </div>
      </div>
    </button>
  );
  })();

  return (
    <SearchQueryContext.Provider value={searchQuery}>
      {content}
    </SearchQueryContext.Provider>
  );
}
