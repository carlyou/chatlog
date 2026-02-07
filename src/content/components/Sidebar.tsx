import type { Message, DisplayMode } from '../../types';
import type { ActiveTarget } from '../hooks/useActiveMessage';
import { PinButton } from './PinButton';
import { MessageList } from './MessageList';
import { DisplayModeSelector } from './DisplayModeSelector';

interface SidebarProps {
  messages: Message[];
  pinned: boolean;
  onTogglePin: () => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  activeMessageId: string | null;
  activeSectionIndex: number | null;
  onLockActive: (target: ActiveTarget) => void;
}

export function Sidebar({ messages, pinned, onTogglePin, displayMode, onDisplayModeChange, activeMessageId, activeSectionIndex, onLockActive }: SidebarProps) {
  return (
    <div
      className={`chatlog-sidebar chatlog-sidebar-right ${pinned ? 'pinned' : ''}`}
    >
      <div className="chatlog-outline-header">
        <span>ChatLog</span>
        <DisplayModeSelector mode={displayMode} onModeChange={onDisplayModeChange} />
        <div className="chatlog-header-actions">
          <span className="chatlog-outline-count">{messages.length}</span>
          <PinButton pinned={pinned} onToggle={onTogglePin} />
        </div>
      </div>
      <MessageList messages={messages} displayMode={displayMode} activeMessageId={activeMessageId} activeSectionIndex={activeSectionIndex} onLockActive={onLockActive} />
    </div>
  );
}
