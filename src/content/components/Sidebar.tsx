import type { DisplayMode, Message } from '../../types';
import type { ActiveTarget } from '../hooks/useActiveMessage';
import { downloadMarkdown } from '../lib/markdown';
import { DisplayModeSelector } from './DisplayModeSelector';
import { DragHandle } from './DragHandle';
import { MessageList } from './MessageList';
import { PinButton } from './PinButton';
import { SearchBar } from './SearchBar';

interface SidebarProps {
  messages: Message[];
  loading?: boolean;
  pinned: boolean;
  peeking?: boolean;
  onTogglePin: () => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  activeMessageId: string | null;
  activeSectionIndex: number | null;
  onLockActive: (target: ActiveTarget) => void;
  onJumpNavigate?: () => void;
  findMessageElement?: (id: string) => Promise<HTMLElement | null>;
  // Search
  searchOpen?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
  searchMatchIds?: string[];
  currentSearchMatchId?: string | null;
  searchTotalMatches?: number;
  searchCurrentMatch?: number;
  onSearchNext?: () => void;
  onSearchPrev?: () => void;
  onSearchClose?: () => void;
  onToggleSearch?: () => void;
  // Bookmarks
  bookmarkFilter?: boolean;
  onToggleBookmarkFilter?: () => void;
  isBookmarked?: (messageId: string) => boolean;
  onToggleBookmark?: (messageId: string) => void;
  // Width
  width?: number;
  onWidthChange?: (w: number) => void;
}

function ShimmerSkeleton() {
  return (
    <div className="chatlog-shimmer-list">
      {[0.85, 0.6, 0.95, 0.5, 0.75, 0.4, 0.9, 0.55].map((w, i) => (
        <div
          key={i}
          className={`chatlog-shimmer-row${i % 3 === 0 ? ' chatlog-shimmer-accent' : ''}`}
          style={{ width: `${w * 100}%` }}
        />
      ))}
    </div>
  );
}

export function Sidebar({
  messages,
  loading,
  pinned,
  peeking,
  onTogglePin,
  displayMode,
  onDisplayModeChange,
  activeMessageId,
  activeSectionIndex,
  onLockActive,
  onJumpNavigate,
  findMessageElement,
  searchOpen,
  searchQuery,
  onSearchQueryChange,
  searchMatchIds,
  currentSearchMatchId,
  searchTotalMatches,
  searchCurrentMatch,
  onSearchNext,
  onSearchPrev,
  onSearchClose,
  onToggleSearch,
  bookmarkFilter,
  onToggleBookmarkFilter,
  isBookmarked,
  onToggleBookmark,
  width,
  onWidthChange,
}: SidebarProps) {
  const activeIndex = activeMessageId
    ? messages.findIndex((m) => m.id === activeMessageId)
    : -1;
  const countDisplay =
    activeIndex >= 0
      ? `${activeIndex + 1}/${messages.length}`
      : `${messages.length}`;

  return (
    <div
      className={`chatlog-sidebar chatlog-sidebar-right ${pinned ? 'pinned' : ''} ${peeking || searchOpen ? 'peeking' : ''}`}
      style={width ? { width: `${width}px` } : undefined}
    >
      {onWidthChange && <DragHandle onDrag={onWidthChange} />}
      <div className="chatlog-outline-header">
        <div className="chatlog-header-title">
          <span>ChatLog</span>
          <span className="chatlog-outline-count">{countDisplay}</span>
        </div>
        <DisplayModeSelector
          mode={displayMode}
          onModeChange={onDisplayModeChange}
        />
        <div className="chatlog-header-actions">
          {onToggleSearch && (
            <button
              className={`chatlog-header-btn${searchOpen ? ' chatlog-search-active' : ''}`}
              onClick={onToggleSearch}
              title="Search (Shift+Space)"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          )}
          {onToggleBookmarkFilter && (
            <button
              className={`chatlog-header-btn${bookmarkFilter ? ' active' : ''}`}
              onClick={onToggleBookmarkFilter}
              title={bookmarkFilter ? 'Show all' : 'Show bookmarked'}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill={bookmarkFilter ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          )}
          <button
            className="chatlog-header-btn"
            onClick={() => downloadMarkdown(messages)}
            title="Export as Markdown"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          <PinButton pinned={pinned} onToggle={onTogglePin} />
        </div>
      </div>
      {searchOpen &&
        onSearchQueryChange &&
        onSearchNext &&
        onSearchPrev &&
        onSearchClose && (
          <SearchBar
            query={searchQuery || ''}
            onQueryChange={onSearchQueryChange}
            currentMatch={searchCurrentMatch || 0}
            totalMatches={searchTotalMatches || 0}
            onNext={onSearchNext}
            onPrev={onSearchPrev}
            onClose={onSearchClose}
          />
        )}
      {loading ? (
        <ShimmerSkeleton />
      ) : (
        <MessageList
          messages={messages}
          displayMode={displayMode}
          activeMessageId={activeMessageId}
          activeSectionIndex={activeSectionIndex}
          onLockActive={onLockActive}
          onJumpNavigate={onJumpNavigate}
          findMessageElement={findMessageElement}
          searchQuery={searchQuery}
          searchMatchIds={searchMatchIds}
          currentSearchMatchId={currentSearchMatchId}
          bookmarkFilter={bookmarkFilter}
          isBookmarked={isBookmarked}
          onToggleBookmark={onToggleBookmark}
        />
      )}
    </div>
  );
}
