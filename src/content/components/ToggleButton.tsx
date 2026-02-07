interface ToggleButtonProps {
  active: boolean;
  onToggle: () => void;
}

export function ToggleButton({ active, onToggle }: ToggleButtonProps) {
  return (
    <div className="chatlog-toggles">
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
    </div>
  );
}
