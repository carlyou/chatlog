import type { Platform } from '../types';
import { useMessages } from './hooks/useMessages';
import { usePinned } from './hooks/usePinned';
import { useDisplayMode } from './hooks/useDisplayMode';
import { useActiveMessage } from './hooks/useActiveMessage';
import { Sidebar } from './components/Sidebar';
import { ToggleButton } from './components/ToggleButton';
import { HoverZone } from './components/HoverZone';

interface AppProps {
  platform: Platform;
}

export function App({ platform }: AppProps) {
  const messages = useMessages(platform);
  const { active: activeTarget, lockActive } = useActiveMessage(messages);
  const { pinned, toggle } = usePinned();
  const { mode, setMode } = useDisplayMode();

  return (
    <>
      <HoverZone hidden={pinned} />
      <Sidebar
        messages={messages}
        pinned={pinned}
        onTogglePin={toggle}
        displayMode={mode}
        onDisplayModeChange={setMode}
        activeMessageId={activeTarget.messageId}
        activeSectionIndex={activeTarget.sectionIndex}
        onLockActive={lockActive}
      />
      <ToggleButton active={pinned} onToggle={toggle} />
    </>
  );
}
