import { useState } from 'react';
import type { ShortcutConfig } from '../../types';
import type { FontId } from '../lib/fonts';
import type { ThemeId } from '../lib/themes';
import { PerfOverlay } from './PerfOverlay';
import { ShortcutSettings } from './ShortcutSettings';

interface ToggleButtonProps {
  active: boolean;
  onToggle: () => void;
  shortcutConfig: ShortcutConfig;
  onShortcutConfigChange: (config: ShortcutConfig) => void;
  perfEnabled: boolean;
  onPerfEnabledChange: (enabled: boolean) => void;
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  glass: boolean;
  onGlassChange: (glass: boolean) => void;
  font: FontId;
  onFontChange: (font: FontId) => void;
}

export function ToggleButton({
  active,
  onToggle,
  shortcutConfig,
  onShortcutConfigChange,
  perfEnabled,
  onPerfEnabledChange,
  theme,
  onThemeChange,
  glass,
  onGlassChange,
  font,
  onFontChange,
}: ToggleButtonProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <PerfOverlay visible={perfEnabled} />
      <div className="chatlog-toggles">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          title="Shortcut settings"
          className={`chatlog-toggle ${settingsOpen ? 'active' : ''}`}
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
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
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
            />
          </svg>
        </button>
        {settingsOpen && (
          <ShortcutSettings
            config={shortcutConfig}
            onChange={onShortcutConfigChange}
            perfEnabled={perfEnabled}
            onPerfEnabledChange={onPerfEnabledChange}
            theme={theme}
            onThemeChange={onThemeChange}
            glass={glass}
            onGlassChange={onGlassChange}
            font={font}
            onFontChange={onFontChange}
          />
        )}
      </div>
    </>
  );
}
