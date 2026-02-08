import { useCallback, useRef, useState } from 'react';
import type { Platform } from '../types';
import { useMessages } from './hooks/useMessages';
import { usePinned } from './hooks/usePinned';
import { useDisplayMode } from './hooks/useDisplayMode';
import { useActiveMessage } from './hooks/useActiveMessage';
import { useShiftKey } from './hooks/useShiftKey';
import { useShortcutConfig } from './hooks/useShortcutConfig';
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

  // Temporarily slide sidebar in on shortcut use while not pinned
  const [peeking, setPeeking] = useState(false);
  const peekTimerRef = useRef(0);
  const peek = useCallback(() => {
    if (pinned) return;
    clearTimeout(peekTimerRef.current);
    setPeeking(true);
    peekTimerRef.current = window.setTimeout(() => setPeeking(false), PEEK_DURATION);
  }, [pinned]);

  const { pushToHistory } = useShiftKey({ mode, setMode, messages, activeTarget, lockActive, shortcutConfig, onPeek: peek });

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
      />
      <ToggleButton
        active={pinned}
        onToggle={toggle}
        shortcutConfig={shortcutConfig}
        onShortcutConfigChange={setShortcutConfig}
      />
    </>
  );
}
