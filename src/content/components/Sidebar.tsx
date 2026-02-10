import type { Message, DisplayMode } from '../../types';
import type { ActiveTarget } from '../hooks/useActiveMessage';
import { PinButton } from './PinButton';
import { MessageList } from './MessageList';
import { DisplayModeSelector } from './DisplayModeSelector';
import { SearchBar } from './SearchBar';
import { DragHandle } from './DragHandle';

interface SidebarProps {
  messages: Message[];
  pinned: boolean;
  peeking?: boolean;
  onTogglePin: () => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  activeMessageId: string | null;
  activeSectionIndex: number | null;
  onLockActive: (target: ActiveTarget) => void;
  onJumpNavigate?: () => void;
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

export function Sidebar({ messages, pinned, peeking, onTogglePin, displayMode, onDisplayModeChange, activeMessageId, activeSectionIndex, onLockActive, onJumpNavigate, searchOpen, searchQuery, onSearchQueryChange, searchMatchIds, currentSearchMatchId, searchTotalMatches, searchCurrentMatch, onSearchNext, onSearchPrev, onSearchClose, onToggleSearch, bookmarkFilter, onToggleBookmarkFilter, isBookmarked, onToggleBookmark, width, onWidthChange }: SidebarProps) {
  return (
    <div
      className={`chatlog-sidebar chatlog-sidebar-right ${pinned ? 'pinned' : ''} ${peeking ? 'peeking' : ''}`}
      style={width ? { width: `${width}px` } : undefined}
    >
      {onWidthChange && <DragHandle onDrag={onWidthChange} />}
      <div className="chatlog-outline-header">
        <div className="chatlog-header-title">
          <span>ChatLog</span>
          <span className="chatlog-outline-count">{messages.length}</span>
        </div>
        <DisplayModeSelector mode={displayMode} onModeChange={onDisplayModeChange} />
        <div className="chatlog-header-actions">
          {onToggleSearch && (
            <button
              className={`chatlog-header-btn${searchOpen ? ' chatlog-search-active' : ''}`}
              onClick={onToggleSearch}
              title="Search (Shift+Space)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill={bookmarkFilter ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          )}
          <PinButton pinned={pinned} onToggle={onTogglePin} />
        </div>
      </div>
      {searchOpen && onSearchQueryChange && onSearchNext && onSearchPrev && onSearchClose && (
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
      <MessageList
        messages={messages}
        displayMode={displayMode}
        activeMessageId={activeMessageId}
        activeSectionIndex={activeSectionIndex}
        onLockActive={onLockActive}
        onJumpNavigate={onJumpNavigate}
        searchQuery={searchQuery}
        searchMatchIds={searchMatchIds}
        currentSearchMatchId={currentSearchMatchId}
        bookmarkFilter={bookmarkFilter}
        isBookmarked={isBookmarked}
        onToggleBookmark={onToggleBookmark}
      />
    </div>
  );
}
