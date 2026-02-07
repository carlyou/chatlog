import type { DisplayMode } from '../../types';

interface DisplayModeSelectorProps {
  mode: DisplayMode;
  onModeChange: (mode: DisplayMode) => void;
}

const modes: { value: DisplayMode; label: string; title: string }[] = [
  { value: 'compact', label: 'C', title: 'Compact' },
  { value: 'detailed', label: 'D', title: 'Detailed' },
];

export function DisplayModeSelector({ mode, onModeChange }: DisplayModeSelectorProps) {
  return (
    <div className="chatlog-mode-selector">
      {modes.map((m) => (
        <button
          key={m.value}
          title={m.title}
          onClick={() => onModeChange(m.value)}
          className={`chatlog-mode-btn ${mode === m.value ? 'active' : ''}`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
