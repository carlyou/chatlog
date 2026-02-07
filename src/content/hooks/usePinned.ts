import { useState, useEffect } from 'react';

export function usePinned() {
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (pinned) {
      document.body.classList.add('chatlog-right-pinned');
    } else {
      document.body.classList.remove('chatlog-right-pinned');
    }
  }, [pinned]);

  const toggle = () => setPinned((p) => !p);

  return { pinned, toggle };
}
