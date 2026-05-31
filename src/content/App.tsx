import { useCallback, useEffect, useRef, useState } from 'react';
import type { Platform } from '../types';
import { HoverZone } from './components/HoverZone';
import { Sidebar } from './components/Sidebar';
import { ToggleButton } from './components/ToggleButton';
import { useActiveMessage } from './hooks/useActiveMessage';
import { useBookmarks } from './hooks/useBookmarks';
import { useDisplayMode } from './hooks/useDisplayMode';
import { useFont } from './hooks/useFont';
import { useFontSize } from './hooks/useFontSize';
import { useMessages } from './hooks/useMessages';
import { usePerfMode } from './hooks/usePerfMode';
import { usePinned } from './hooks/usePinned';
import { useSearch } from './hooks/useSearch';
import { useShiftKey } from './hooks/useShiftKey';
import { useShortcutConfig } from './hooks/useShortcutConfig';
import { useSidebarWidth } from './hooks/useSidebarWidth';
import { useTheme } from './hooks/useTheme';

const PEEK_DURATION = 2000;

interface AppProps {
  platform: Platform;
  shadowHost: HTMLElement;
}

export function App({ platform, shadowHost }: AppProps) {
  const searchPausedRef = useRef(false);
  const [messages, reconcileMessages, messagesLoading] = useMessages(
    platform,
    searchPausedRef,
  );
  const { active: activeTarget, lockActive } = useActiveMessage(messages);
  const { pinned, toggle } = usePinned();
  const { mode, setMode } = useDisplayMode();
  const { config: shortcutConfig, setConfig: setShortcutConfig } =
    useShortcutConfig();
  const { theme, setTheme, glass, setGlass } = useTheme(shadowHost, platform);
  const { font, setFont } = useFont(shadowHost, platform);
  const { fontSize, setFontSize } = useFontSize(shadowHost, platform);
  const search = useSearch(messages, platform, lockActive);

  // Pause message reconciliation while search is active to avoid disrupting match positions
  useEffect(() => {
    searchPausedRef.current = search.isOpen;
    if (!search.isOpen) reconcileMessages();
  }, [search.isOpen, reconcileMessages]);

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
    peekTimerRef.current = window.setTimeout(
      () => setPeeking(false),
      PEEK_DURATION,
    );
  }, [pinned]);

  const { pushToHistory } = useShiftKey({
    mode,
    setMode,
    messages,
    activeTarget,
    lockActive,
    shortcutConfig,
    onPeek: peek,
    onTogglePin: toggle,
    onToggleSearch: search.toggle,
  });

  const currentSearchMatchId = search.currentMatchMsgId;

  return (
    <>
      <HoverZone hidden={pinned} />
      <Sidebar
        messages={messages}
        loading={messagesLoading}
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
        theme={theme}
        onThemeChange={setTheme}
        glass={glass}
        onGlassChange={setGlass}
        font={font}
        onFontChange={setFont}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
      />
    </>
  );
}
