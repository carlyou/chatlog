import { useState } from 'react';
import type { ShortcutConfig } from '../../types';
import { ShortcutSettings } from './ShortcutSettings';

interface ToggleButtonProps {
  active: boolean;
  onToggle: () => void;
  shortcutConfig: ShortcutConfig;
  onShortcutConfigChange: (config: ShortcutConfig) => void;
}

export function ToggleButton({ active, onToggle, shortcutConfig, onShortcutConfigChange }: ToggleButtonProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="chatlog-toggles">
      <button
        onClick={() => setSettingsOpen(!settingsOpen)}
        title="Shortcut settings"
        className={`chatlog-toggle ${settingsOpen ? 'active' : ''}`}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      </button>
      <button
        onClick={onToggle}
        title="Toggle outline"
        className={`chatlog-toggle ${active ? 'active' : ''}`}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
          />
        </svg>
      </button>
      {settingsOpen && (
        <ShortcutSettings config={shortcutConfig} onChange={onShortcutConfigChange} />
      )}
    </div>
  );
}
