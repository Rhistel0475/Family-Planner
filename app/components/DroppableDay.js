'use client';

import { useDroppable } from '@dnd-kit/core';

export default function DroppableDay({ id, children, style = {} }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const dropStyle = {
    ...style,
    border: isOver ? '3px dashed #3f2d1d' : style.border,
    background: isOver
      ? 'rgba(201, 247, 165, 0.3)'
      : style.background,
    transform: isOver
      ? 'scale(1.02) rotate(0deg)'
      : style.transform,
    transition: 'all 200ms ease',
  };

  return (
    <article ref={setNodeRef} style={dropStyle}>
      {children}
    </article>
  );
}
