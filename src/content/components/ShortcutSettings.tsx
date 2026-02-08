import { useState, useEffect, useCallback } from 'react';
import type { ShortcutConfig, ShortcutBinding } from '../../types';
import { bindingLabel } from '../lib/shortcutMatcher';
import { DEFAULT_SHORTCUTS } from '../hooks/useShortcutConfig';

interface ShortcutSettingsProps {
  config: ShortcutConfig;
  onChange: (config: ShortcutConfig) => void;
}

const LABELS: Record<keyof ShortcutConfig, string> = {
  toggleMode: 'Toggle mode',
  historyBack: 'History back',
  historyForward: 'History forward',
  sectionPrev: 'Previous section',
  sectionNext: 'Next section',
};

export function ShortcutSettings({ config, onChange }: ShortcutSettingsProps) {
  const [listeningKey, setListeningKey] = useState<keyof ShortcutConfig | null>(null);

  const handleCapture = useCallback((e: KeyboardEvent) => {
    if (!listeningKey) return;
    // Ignore bare modifier keys
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;

    e.preventDefault();
    e.stopPropagation();

    const newBinding: ShortcutBinding = {
      enabled: config[listeningKey].enabled,
      key: e.key,
      shift: e.shiftKey || undefined,
      ctrl: e.ctrlKey || undefined,
      alt: e.altKey || undefined,
      meta: e.metaKey || undefined,
    };

    onChange({ ...config, [listeningKey]: newBinding });
    setListeningKey(null);
  }, [listeningKey, config, onChange]);

  useEffect(() => {
    if (!listeningKey) return;
    window.addEventListener('keydown', handleCapture, { capture: true });
    return () => window.removeEventListener('keydown', handleCapture, { capture: true });
  }, [listeningKey, handleCapture]);

  const toggleEnabled = (key: keyof ShortcutConfig) => {
    onChange({
      ...config,
      [key]: { ...config[key], enabled: !config[key].enabled },
    });
  };

  const resetDefaults = () => {
    onChange({ ...DEFAULT_SHORTCUTS });
    setListeningKey(null);
  };

  return (
    <div className="chatlog-shortcut-settings">
      {(Object.keys(LABELS) as (keyof ShortcutConfig)[]).map((key) => (
        <div key={key} className="chatlog-shortcut-row">
          <label className="chatlog-shortcut-label">
            <input
              type="checkbox"
              checked={config[key].enabled}
              onChange={() => toggleEnabled(key)}
            />
            {LABELS[key]}
          </label>
          <button
            className={`chatlog-shortcut-bind${listeningKey === key ? ' listening' : ''}`}
            onClick={() => setListeningKey(listeningKey === key ? null : key)}
          >
            {listeningKey === key ? 'Press a key…' : bindingLabel(config[key])}
          </button>
        </div>
      ))}
      <button className="chatlog-shortcut-reset" onClick={resetDefaults}>
        Reset to defaults
      </button>
    </div>
  );
}
