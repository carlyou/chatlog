interface BookmarkButtonProps {
  bookmarked: boolean;
  onToggle: () => void;
}

export function BookmarkButton({ bookmarked, onToggle }: BookmarkButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  return (
    <button
      className={`chatlog-bookmark-btn${bookmarked ? ' bookmarked' : ''}`}
      onClick={handleClick}
      title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}
