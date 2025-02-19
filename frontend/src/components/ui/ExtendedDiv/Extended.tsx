import React, { ReactNode } from 'react';
import { Resizable } from '@/components/ui/ExtendedDiv/Resizable.tsx';
import { Draggable } from '@/components/ui/ExtendedDiv/Draggable.tsx';
import style from './extended.module.scss';

export const Extended: React.FC<{
  top?: number;
  left?: number;
  height?: number;
  width?: number;
  onTopMove?(value: number): void;
  onLeftMove?(value: number): void;
  onWidthMove?(value: number): void;
  onHeightMove?(value: number): void;
  onUp?(): void;
  draggable?: boolean;
  resizable?: boolean;
  verticalResizable?: boolean;
  horizontalResizable?: boolean;
  children?: ReactNode;
  className?: string;
  innerClassName?: string;
  onClick?: () => void;
}> = ({
        draggable = false,
        children,
        onTopMove, onLeftMove,
        onWidthMove, onHeightMove,
        onUp,
        top, height, left, width,
        verticalResizable,
        horizontalResizable,
        resizable,
        className, innerClassName,
        onClick,
      }) => {
  return (
    <Resizable onLeftMove={ onLeftMove } onTopMove={ onTopMove }
               onWidthMove={ onWidthMove } onHeightMove={ onHeightMove }
               top={ top } height={ height }
               left={ left } width={ width }
               horizontalResize={ horizontalResizable }
               verticalResize={ verticalResizable }
               resizable={ resizable }
               className={ className }
               onUp={ onUp }
               onClick={ onClick }>
      <Draggable onXMove={ onLeftMove } onYMove={ onTopMove } onUp={ onUp }
                 draggable={ draggable } className={ [ style.fill, innerClassName ].join(' ') }>
        { children }
      </Draggable>
    </Resizable>
  )
}