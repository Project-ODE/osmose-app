import React, { MouseEvent, ReactNode, useRef } from 'react';
import { MOUSE_MOVE_EVENT, MOUSE_UP_EVENT } from '@/service/events';
import style from './extended.module.scss';

export const Draggable: React.FC<{
  onXMove?(movement: number): void;
  onYMove?(movement: number): void;
  onUp?(): void;
  children?: ReactNode;
  draggable?: boolean;
  className?: string;
}> = ({
        draggable,
        onXMove, onYMove, onUp,
        children, className
      }) => {
  const isDragging = useRef<boolean>(false);

  function mouseDown(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    isDragging.current = true;
    MOUSE_MOVE_EVENT.add(mouseMove)
    MOUSE_UP_EVENT.add(mouseUp)
  }

  function mouseMove(event: MouseEvent) {
    if (!draggable || !isDragging.current) return;
    event.stopPropagation();
    event.preventDefault();
    if (onXMove) onXMove(event.movementX);
    if (onYMove) onYMove(event.movementY);
  }

  function mouseUp() {
    if (isDragging.current) {
      isDragging.current = false;
      if (onUp && draggable) onUp()
    }
    MOUSE_MOVE_EVENT.remove(mouseMove)
    MOUSE_UP_EVENT.remove(mouseUp)
  }

  return (
    <div onMouseDown={ mouseDown }
         children={ children }
         className={ [ draggable ? style.draggable : '', className ].join(' ') }/>
  )
}