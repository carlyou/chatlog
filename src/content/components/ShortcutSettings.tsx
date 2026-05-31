import { useCallback, useEffect, useState } from 'react';
import type { ShortcutBinding, ShortcutConfig } from '../../types';
import { DEFAULT_SHORTCUTS } from '../hooks/useShortcutConfig';
import { FONT_SIZES, type FontSize } from '../lib/fontSize';
import type { FontId, FontMeta } from '../lib/fonts';
import { FONTS } from '../lib/fonts';
import { bindingLabel } from '../lib/shortcutMatcher';
import type { ThemeId } from '../lib/themes';
import { THEMES } from '../lib/themes';

interface ShortcutSettingsProps {
  config: ShortcutConfig;
  onChange: (config: ShortcutConfig) => void;
  perfEnabled?: boolean;
  onPerfEnabledChange?: (enabled: boolean) => void;
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  glass: boolean;
  onGlassChange: (glass: boolean) => void;
  font: FontId;
  onFontChange: (font: FontId) => void;
  fontSize: FontSize;
  onFontSizeChange: (size: FontSize) => void;
}

/** Group fonts by `FontMeta.group`, preserving the order they appear in
 *  FONTS so the <select> renders <optgroup>s with predictable ordering. */
function groupedFonts(): Array<{ group: string | null; fonts: FontMeta[] }> {
  const groups: Array<{ group: string | null; fonts: FontMeta[] }> = [];
  for (const f of FONTS) {
    const g = f.group ?? null;
    let bucket = groups[groups.length - 1];
    if (!bucket || bucket.group !== g) {
      bucket = { group: g, fonts: [] };
      groups.push(bucket);
    }
    bucket.fonts.push(f);
  }
  return groups;
}

const LABELS: Record<keyof ShortcutConfig, string> = {
  toggleMode: 'Toggle mode',
  toggleSidebar: 'Toggle sidebar',
  toggleSearch: 'Toggle search',
  historyBack: 'History back',
  historyForward: 'History forward',
  sectionPrev: 'Previous section',
  sectionNext: 'Next section',
};

export function ShortcutSettings({
  config,
  onChange,
  perfEnabled,
  onPerfEnabledChange,
  theme,
  onThemeChange,
  glass,
  onGlassChange,
  font,
  onFontChange,
  fontSize,
  onFontSizeChange,
}: ShortcutSettingsProps) {
  const [listeningKey, setListeningKey] = useState<keyof ShortcutConfig | null>(
    null,
  );

  const handleCapture = useCallback(
    (e: KeyboardEvent) => {
      if (!listeningKey) return;
      // Ignore bare modifier keys
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

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
    },
    [listeningKey, config, onChange],
  );

  useEffect(() => {
    if (!listeningKey) return;
    // Blur host page input so keystrokes don't leak there
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    window.addEventListener('keydown', handleCapture, { capture: true });
    return () =>
      window.removeEventListener('keydown', handleCapture, { capture: true });
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
      <div className="chatlog-shortcut-row">
        <span className="chatlog-shortcut-label">Theme</span>
        <select
          className="chatlog-theme-select"
          value={theme}
          onChange={(e) => onThemeChange(e.target.value as ThemeId)}
        >
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="chatlog-shortcut-row">
        <span className="chatlog-shortcut-label">Font</span>
        <select
          className="chatlog-theme-select"
          value={font}
          onChange={(e) => onFontChange(e.target.value as FontId)}
        >
          {groupedFonts().map(({ group, fonts }) =>
            group ? (
              <optgroup key={group} label={group}>
                {fonts.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </optgroup>
            ) : (
              fonts.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))
            ),
          )}
        </select>
      </div>
      <div className="chatlog-shortcut-row">
        <span className="chatlog-shortcut-label">Font size</span>
        <select
          className="chatlog-theme-select"
          value={fontSize}
          onChange={(e) => onFontSizeChange(Number(e.target.value) as FontSize)}
        >
          {FONT_SIZES.map((n) => (
            <option key={n} value={n}>
              {n}%
            </option>
          ))}
        </select>
      </div>
      <div className="chatlog-shortcut-row">
        <label className="chatlog-shortcut-label">
          <input
            type="checkbox"
            checked={glass}
            onChange={(e) => onGlassChange(e.target.checked)}
          />
          Glass effect
        </label>
      </div>
      <div className="chatlog-shortcut-extra-row" />
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
      {onPerfEnabledChange && (
        <div className="chatlog-shortcut-row chatlog-shortcut-extra-row">
          <label className="chatlog-shortcut-label">
            <input
              type="checkbox"
              checked={!!perfEnabled}
              onChange={(e) => onPerfEnabledChange(e.target.checked)}
            />
            Performance overlay
          </label>
        </div>
      )}
      <button className="chatlog-shortcut-reset" onClick={resetDefaults}>
        Reset to defaults
      </button>
    </div>
  );
}
