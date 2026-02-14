import { useEffect, useRef } from 'react';

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  currentMatch: number;
  totalMatches: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export function SearchBar({ query, onQueryChange, currentMatch, totalMatches, onNext, onPrev, onClose }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Delay focus to ensure it wins over host page input stealing focus
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' && e.shiftKey) {
      // Handle toggle directly and stop all propagation
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }
    e.stopPropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) onPrev();
      else onNext();
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    // Also prevent keyup for Shift+Space to ensure no space is typed
    if (e.key === ' ' && e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
  };

  const stopProp = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div className="chatlog-search-bar">
      <input
        ref={inputRef}
        type="text"
        className="chatlog-search-input"
        placeholder="Search..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onKeyPress={stopProp}
      />
      {query && (
        <span className="chatlog-search-count">
          {totalMatches > 0 ? `${currentMatch + 1}/${totalMatches}` : '0'}
        </span>
      )}
      <button className="chatlog-search-close" onClick={onClose} title="Close">
        <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="1" y1="1" x2="9" y2="9" />
          <line x1="9" y1="1" x2="1" y2="9" />
        </svg>
      </button>
    </div>
  );
}
