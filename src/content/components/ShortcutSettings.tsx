import { useCallback, useEffect, useState } from 'react';
import type { ShortcutBinding, ShortcutConfig } from '../../types';
import { DEFAULT_SHORTCUTS } from '../hooks/useShortcutConfig';
import {
  clampFontSize,
  FONT_SIZE_STEP,
  type FontSize,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  snapFontSize,
} from '../lib/fontSize';
import type { FontId, FontMeta } from '../lib/fonts';
import { FONTS } from '../lib/fonts';
import {
  clampFontWeight,
  FONT_WEIGHT_STEP,
  type FontWeight,
  MAX_FONT_WEIGHT,
  MIN_FONT_WEIGHT,
  snapFontWeight,
} from '../lib/fontWeight';
import { bindingLabel } from '../lib/shortcutMatcher';
import type { ThemeId } from '../lib/themes';
import { groupedThemes } from '../lib/themes';

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
  fontWeight: FontWeight;
  onFontWeightChange: (weight: FontWeight) => void;
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
  fontWeight,
  onFontWeightChange,
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
          {groupedThemes().map(({ group, themes }) => (
            <optgroup key={group} label={group}>
              {themes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </optgroup>
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
        <div className="chatlog-font-size-stepper">
          <button
            type="button"
            className="chatlog-font-size-btn"
            aria-label="Decrease font size"
            disabled={fontSize <= MIN_FONT_SIZE}
            onClick={() =>
              onFontSizeChange(snapFontSize(fontSize - FONT_SIZE_STEP))
            }
          >
            −
          </button>
          <input
            type="number"
            className="chatlog-font-size-input"
            inputMode="numeric"
            min={MIN_FONT_SIZE}
            max={MAX_FONT_SIZE}
            step={FONT_SIZE_STEP}
            value={fontSize}
            onChange={(e) => {
              const raw = Number(e.target.value);
              if (Number.isFinite(raw)) onFontSizeChange(clampFontSize(raw));
            }}
            onBlur={(e) => {
              // Snap to nearest step on blur to keep the displayed value tidy.
              const raw = Number(e.target.value);
              if (Number.isFinite(raw)) onFontSizeChange(snapFontSize(raw));
            }}
          />
          <span className="chatlog-font-size-unit">%</span>
          <button
            type="button"
            className="chatlog-font-size-btn"
            aria-label="Increase font size"
            disabled={fontSize >= MAX_FONT_SIZE}
            onClick={() =>
              onFontSizeChange(snapFontSize(fontSize + FONT_SIZE_STEP))
            }
          >
            +
          </button>
        </div>
      </div>
      <div className="chatlog-shortcut-row">
        <span className="chatlog-shortcut-label">Font weight</span>
        <div className="chatlog-font-size-stepper">
          <button
            type="button"
            className="chatlog-font-size-btn"
            aria-label="Decrease font weight"
            disabled={fontWeight <= MIN_FONT_WEIGHT}
            onClick={() =>
              onFontWeightChange(snapFontWeight(fontWeight - FONT_WEIGHT_STEP))
            }
          >
            −
          </button>
          <input
            type="number"
            className="chatlog-font-size-input"
            inputMode="numeric"
            min={MIN_FONT_WEIGHT}
            max={MAX_FONT_WEIGHT}
            step={FONT_WEIGHT_STEP}
            value={fontWeight}
            onChange={(e) => {
              const raw = Number(e.target.value);
              if (Number.isFinite(raw))
                onFontWeightChange(clampFontWeight(raw));
            }}
            onBlur={(e) => {
              // Snap to nearest step on blur to keep the displayed value tidy.
              const raw = Number(e.target.value);
              if (Number.isFinite(raw)) onFontWeightChange(snapFontWeight(raw));
            }}
          />
          <button
            type="button"
            className="chatlog-font-size-btn"
            aria-label="Increase font weight"
            disabled={fontWeight >= MAX_FONT_WEIGHT}
            onClick={() =>
              onFontWeightChange(snapFontWeight(fontWeight + FONT_WEIGHT_STEP))
            }
          >
            +
          </button>
        </div>
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
