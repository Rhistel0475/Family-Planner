'use client';

import { useDraggable } from '@dnd-kit/core';

export default function DraggableItem({ id, type, data, children, style = {} }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: {
      ...data,
      type,
    },
  });

  const dragStyle = {
    ...style,
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.5 : 1,
    transition: 'opacity 200ms ease',
  };

  return (
    <div ref={setNodeRef} style={dragStyle} {...listeners} {...attributes}>
      {children}
    </div>
  );
}
