import type { Message, DisplayMode } from '../../types';
import type { ActiveTarget } from '../hooks/useActiveMessage';
import { PinButton } from './PinButton';
import { MessageList } from './MessageList';
import { DisplayModeSelector } from './DisplayModeSelector';

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
}

export function Sidebar({ messages, pinned, peeking, onTogglePin, displayMode, onDisplayModeChange, activeMessageId, activeSectionIndex, onLockActive, onJumpNavigate }: SidebarProps) {
  return (
    <div
      className={`chatlog-sidebar chatlog-sidebar-right ${pinned ? 'pinned' : ''} ${peeking ? 'peeking' : ''}`}
    >
      <div className="chatlog-outline-header">
        <span>ChatLog</span>
        <DisplayModeSelector mode={displayMode} onModeChange={onDisplayModeChange} />
        <div className="chatlog-header-actions">
          <span className="chatlog-outline-count">{messages.length}</span>
          <PinButton pinned={pinned} onToggle={onTogglePin} />
        </div>
      </div>
      <MessageList messages={messages} displayMode={displayMode} activeMessageId={activeMessageId} activeSectionIndex={activeSectionIndex} onLockActive={onLockActive} onJumpNavigate={onJumpNavigate} />
    </div>
  );
}
