import { useCallback, useEffect, useRef } from 'react';

interface DragHandleProps {
  onDrag: (width: number) => void;
}

export function DragHandle({ onDrag }: DragHandleProps) {
  const draggingRef = useRef(false);
  const handleRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    // Keep sidebar visible while dragging
    handleRef.current?.closest('.chatlog-sidebar')?.classList.add('chatlog-dragging');
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const width = window.innerWidth - e.clientX;
      onDrag(width);
    };

    const onMouseUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      handleRef.current?.closest('.chatlog-sidebar')?.classList.remove('chatlog-dragging');
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onDrag]);

  return <div ref={handleRef} className="chatlog-drag-handle" onMouseDown={onMouseDown} />;
}
