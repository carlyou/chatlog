import { useCallback, useRef, useState } from 'react';
import type { Platform } from '../types';
import { useMessages } from './hooks/useMessages';
import { usePinned } from './hooks/usePinned';
import { useDisplayMode } from './hooks/useDisplayMode';
import { useActiveMessage } from './hooks/useActiveMessage';
import { useShiftKey } from './hooks/useShiftKey';
import { useShortcutConfig } from './hooks/useShortcutConfig';
import { useSearch } from './hooks/useSearch';
import { useBookmarks } from './hooks/useBookmarks';
import { useSidebarWidth } from './hooks/useSidebarWidth';
import { usePerfMode } from './hooks/usePerfMode';
import { Sidebar } from './components/Sidebar';
import { ToggleButton } from './components/ToggleButton';
import { HoverZone } from './components/HoverZone';

const PEEK_DURATION = 2000;

interface AppProps {
  platform: Platform;
}

export function App({ platform }: AppProps) {
  const messages = useMessages(platform);
  const { active: activeTarget, lockActive } = useActiveMessage(messages);
  const { pinned, toggle } = usePinned();
  const { mode, setMode } = useDisplayMode();
  const { config: shortcutConfig, setConfig: setShortcutConfig } = useShortcutConfig();
  const search = useSearch(messages);
  const bookmarks = useBookmarks(platform);
  const { width, setWidth } = useSidebarWidth();
  const { enabled: perfEnabled, setEnabled: setPerfEnabled } = usePerfMode();

  // Temporarily slide sidebar in on shortcut use while not pinned
  const [peeking, setPeeking] = useState(false);
  const peekTimerRef = useRef(0);
  const peek = useCallback(() => {
    if (pinned) return;
    clearTimeout(peekTimerRef.current);
    setPeeking(true);
    peekTimerRef.current = window.setTimeout(() => setPeeking(false), PEEK_DURATION);
  }, [pinned]);

  const { pushToHistory } = useShiftKey({
    mode, setMode, messages, activeTarget, lockActive, shortcutConfig,
    onPeek: peek, onTogglePin: toggle, onToggleSearch: search.toggle,
  });

  const currentSearchMatchId = search.matchIds.length > 0 ? search.matchIds[search.currentMatch] : null;

  return (
    <>
      <HoverZone hidden={pinned} />
      <Sidebar
        messages={messages}
        pinned={pinned}
        peeking={peeking}
        onTogglePin={toggle}
        displayMode={mode}
        onDisplayModeChange={setMode}
        activeMessageId={activeTarget.messageId}
        activeSectionIndex={activeTarget.sectionIndex}
        onLockActive={lockActive}
        onJumpNavigate={pushToHistory}
        searchOpen={search.isOpen}
        searchQuery={search.query}
        onSearchQueryChange={search.setQuery}
        searchMatchIds={search.matchIds}
        currentSearchMatchId={currentSearchMatchId}
        searchTotalMatches={search.totalMatches}
        searchCurrentMatch={search.currentMatch}
        onSearchNext={search.nextMatch}
        onSearchPrev={search.prevMatch}
        onSearchClose={search.close}
        onToggleSearch={search.toggle}
        bookmarkFilter={bookmarks.showOnly}
        onToggleBookmarkFilter={bookmarks.toggleShowOnly}
        isBookmarked={bookmarks.isBookmarked}
        onToggleBookmark={bookmarks.toggle}
        width={width}
        onWidthChange={setWidth}
      />
      <ToggleButton
        active={pinned}
        onToggle={toggle}
        shortcutConfig={shortcutConfig}
        onShortcutConfigChange={setShortcutConfig}
        perfEnabled={perfEnabled}
        onPerfEnabledChange={setPerfEnabled}
      />
    </>
  );
}
