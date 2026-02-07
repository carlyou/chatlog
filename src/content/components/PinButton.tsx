interface PinButtonProps {
  pinned: boolean;
  onToggle: () => void;
}

export function PinButton({ pinned, onToggle }: PinButtonProps) {
  return (
    <button
      onClick={onToggle}
      title={pinned ? 'Unpin sidebar' : 'Pin sidebar'}
      className={`chatlog-pin-btn ${pinned ? 'pinned' : ''}`}
    >
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 2v8M8 6v4l-2 2v2h5v6h2v-6h5v-2l-2-2V6"
        />
      </svg>
    </button>
  );
}
